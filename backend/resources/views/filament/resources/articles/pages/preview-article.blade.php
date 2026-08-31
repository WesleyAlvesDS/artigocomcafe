<x-filament-panels::page>
    <div class="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
        <!-- Header -->
        <div class="border-b pb-6 mb-6">
            <div class="flex items-center gap-2 mb-3">
                <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
                    {{ $record->category->name ?? 'Geral' }}
                </span>
                <span class="text-xs text-gray-400">•</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ $record->published_at ? $record->published_at->format('d/m/Y H:i') : 'Rascunho' }}
                </span>
            </div>
            
            <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
                {{ $record->title }}
            </h1>

            @if($record->excerpt)
                <p class="text-lg text-gray-600 dark:text-gray-300 italic border-l-4 border-primary-500 pl-4 py-1">
                    {{ $record->excerpt }}
                </p>
            @endif
        </div>

        <!-- Cover Image -->
        @if($record->cover_image)
            <div class="mb-8 overflow-hidden rounded-xl">
                <img src="{{ $record->cover_image }}" alt="{{ $record->title }}" class="w-full h-auto object-cover max-h-[400px]">
            </div>
        @endif

        <!-- Content Body (Estilo Blog Gutenberg) -->
        <div class="prose dark:prose-invert max-w-none prose-lg leading-relaxed text-gray-800 dark:text-gray-200">
            {!! $record->content !!}
        </div>

        <!-- Meta Footer -->
        <div class="mt-12 pt-6 border-t flex items-center justify-between text-sm text-gray-500">
            <div>
                <strong>Autor:</strong> {{ $record->author->name ?? 'Equipe Artigo com Café' }}
            </div>
            <div>
                <strong>Score SEO:</strong> <span class="font-bold text-green-600">{{ $record->meta['seo_score'] ?? 'N/A' }}%</span>
            </div>
        </div>
    </div>
</x-filament-panels::page>