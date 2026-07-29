<?php

namespace App\Console\Commands;

use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportWpPosts extends Command
{
    protected $signature = 'wp:import {file=/tmp/wp_data2.json}';
    protected $description = 'Import WordPress posts from JSON export';

    public function handle(): int
    {
        $file = $this->argument('file');

        if (!file_exists($file)) {
            $this->error("File not found: $file");
            return self::FAILURE;
        }

        $json = file_get_contents($file);
        $data = json_decode($json, true);

        if (!$data) {
            $this->error('Invalid JSON file: ' . json_last_error_msg());
            return self::FAILURE;
        }

        $admin = User::first();
        if (!$admin) {
            $this->warn('No user found. Creating admin user...');
            $admin = User::create([
                'name' => 'Admin',
                'email' => 'admin@artigocomcafe.com',
                'password' => bcrypt(\Illuminate\Support\Str::random(32)),
                'username' => 'admin',
            ]);
            $this->info('  Admin user created');
        }

        $this->info("Importing categories...");
        $categoryMap = [];
        foreach ($data['categories'] as $cat) {
            $category = Category::firstOrCreate(
                ['slug' => $cat['slug']],
                [
                    'name' => $cat['name'],
                    'description' => $cat['description'] ?? '',
                    'is_active' => true,
                ]
            );
            $categoryMap[$cat['slug']] = $category->id;
        }
        $this->info("  " . count($data['categories']) . " categories imported");

        $this->info("Importing tags...");
        $tagMap = [];
        foreach ($data['tags'] as $tag) {
            $tagName = mb_substr($tag['name'], 0, 200);
            $tagSlug = mb_substr($tag['slug'], 0, 200);
            $t = Tag::firstOrCreate(
                ['slug' => $tagSlug],
                ['name' => $tagName]
            );
            $tagMap[$tag['slug']] = $t->id;
            // Map alternate slugs (from truncation)
            if ($tagSlug !== $tag['slug']) {
                $tagMap[$tagSlug] = $t->id;
            }
            $tagMap[$tag['slug']] = $t->id;
        }
        $this->info("  " . count($data['tags']) . " tags imported");

        $this->info("Importing posts...");
        $count = 0;
        foreach ($data['posts'] as $post) {
            $slug = $post['slug'];
            $existing = Article::where('slug', $slug)->first();
            if ($existing) {
                $this->warn("  Skipping existing: {$post['title']}");
                continue;
            }

            $content = base64_decode($post['content_b64']);
            $excerpt = base64_decode($post['excerpt_b64']);
            $content = $this->cleanWpContent($content);

            $title = mb_substr($post['title'], 0, 200);
            $slug = $this->sanitizeSlug($slug);
            $slug = mb_substr($slug, 0, 200);

            $catId = null;
            if (!empty($post['categories'])) {
                $catSlug = $post['categories'][0];
                $catId = $categoryMap[$catSlug] ?? null;
            }

            $metaData = [];
            if (!empty($post['meta_title'])) $metaData['rank_math_title'] = $post['meta_title'];
            if (!empty($post['meta_desc'])) $metaData['rank_math_description'] = $post['meta_desc'];
            if (!empty($post['focus_keyword'])) $metaData['rank_math_focus_keyword'] = $post['focus_keyword'];

            $readingTime = $this->calculateReadingTime($content);

            $article = Article::create([
                'title' => $title,
                'slug' => $slug,
                'content' => $content,
                'excerpt' => $excerpt ?: null,
                'category_id' => $catId,
                'user_id' => $admin->id,
                'status' => 'published',
                'reading_time' => $readingTime,
                'meta' => $metaData ?: null,
                'published_at' => $post['date'],
                'created_at' => $post['date'],
                'updated_at' => $post['date'],
            ]);

            $tagIds = [];
            foreach ($post['tags'] as $tagSlug) {
                if (isset($tagMap[$tagSlug])) {
                    $tagIds[] = $tagMap[$tagSlug];
                }
            }
            if ($tagIds) {
                $article->tags()->sync($tagIds);
            }

            if (!empty($post['featured_image'])) {
                $this->downloadImage($article, $post['featured_image']);
            }

            $count++;
            $this->info("  Imported: {$post['title']}");
        }

        $this->info("Done! $count posts imported.");
        return self::SUCCESS;
    }

    private function sanitizeSlug(string $slug): string
    {
        $slug = urldecode($slug);
        $slug = preg_replace('/[^\x20-\x7E\-]/u', '', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');
        return $slug ?: 'post-' . Str::random(8);
    }

    private function cleanWpContent(string $content): string
    {
        // Remove WordPress block comments
        $content = preg_replace('/<!-- wp:[^>]+-->/', '', $content);
        $content = preg_replace('/<!-- \/wp:[^>]+-->/', '', $content);
        // Clean up figure tags
        $content = preg_replace('/<figure[^>]*class="wp-block-table"[^>]*>/i', '<figure class="wp-block-table">', $content);
        $content = preg_replace('/<figure[^>]*class="wp-block-image[^"]*"[^>]*>/i', '<figure>', $content);
        // Remove figcaptions
        $content = preg_replace('/<figcaption[^>]*>.*?<\/figcaption>/i', '', $content);
        // Remove style and svg tags
        $content = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $content);
        $content = preg_replace('/<svg[^>]*>.*?<\/svg>/is', '', $content);
        // Remove empty class/style attributes
        $content = preg_replace('/\s+class="[^"]*"/', '', $content);
        $content = preg_replace('/\s+style="[^"]*"/', '', $content);
        // Remove empty paragraphs
        $content = preg_replace('/<p[^>]*>\s*<\/p>/', '', $content);
        // Remove Essential Blocks empty divs
        $content = preg_replace('/<div[^>]*>\s*<\/div>/', '', $content);
        // Decode HTML entities in content
        $content = html_entity_decode($content, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return trim($content);
    }

    private function calculateReadingTime(string $content): string
    {
        $text = strip_tags($content);
        $wordCount = str_word_count($text);
        $minutes = max(1, ceil($wordCount / 200));
        return "{$minutes} min";
    }

    private function downloadImage(Article $article, string $url): void
    {
        $article->update(['featured_image' => $url]);
        try {
            $response = Http::timeout(15)->get($url);
            if ($response->successful()) {
                $ext = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'jpg';
                $name = $article->slug . '.' . $ext;
                $path = 'articles/' . $article->id . '/' . $name;
                Storage::disk('public')->put($path, $response->body());
                $article->update(['cover_image' => 'storage/' . $path]);
                $this->info("    Image downloaded");
            }
        } catch (\Exception $e) {
            $this->warn("    Could not download image: " . $e->getMessage());
        }
    }
}
