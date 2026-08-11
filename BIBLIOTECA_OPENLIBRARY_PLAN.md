# 📚 Biblioteca Artigo com Café - Plano de Integração OpenLibrary

> **Visão**: Transformar o site em uma plataforma de conhecimento completa onde usuários podem descobrir, colecionar e interagir com livros técnicos, café-literatura e receitas - tudo em uma experiência imersiva, gamificada e social.

---

## 🎯 Objetivos Principais

1. **Descoberta Inteligente**: Busca unificada (livros + receitas + artigos) com filtros avançados
2. **Experiência Imersiva**: Visualização de capas em alta resolução, sinopses ricas, zoom fluido
3. **Coleção Pessoal**: Biblioteca digital do usuário (livros lidos, quer ler, favoritos, receitas salvas)
4. **Gamificação**: Conquistas de leitura, streaks, desafios temáticos
5. **Social**: Compartilhamento, listas públicas, recomendações baseadas em perfil

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Astro + React Islands)         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Pages      │  │  Components │  │  Islands    │             │
│  │  /biblioteca│  │  BookCard   │  │  BookViewer │             │
│  │  /livro/[id]│  │  BookShelf  │  │  CoverZoom  │             │
│  │  /perfil    │  │  SearchBar  │  │  Collection │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              STATE MANAGEMENT (Nano Stores)              │   │
│  │  bookStore, collectionStore, searchStore, uiStore       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Laravel API)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Controllers│  │  Services   │  │  Jobs/Queue │             │
│  │  BookCtrl   │  │  OpenLibSync│  │  CoverFetch │             │
│  │  Collection │  │  SearchIdx  │  │  SyncCovers │             │
│  │  SearchCtrl │  │  Recommender│  │  WebhookHdl │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DATABASE (MySQL)                                       │   │
│  │  books, collections, shelves, reading_sessions,         │   │
│  │  book_covers, search_index, user_preferences            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL APIs                                │
├─────────────────────────────────────────────────────────────────┤
│  📖 OpenLibrary API (https://openlibrary.org/developers/api)   │
│  🖼️  Covers API (covers.openlibrary.org)                        │
│  🔍  Search API (openlibrary.org/search.json)                   │
│  📚  Works API (openlibrary.org/works/OLxxxxW.json)             │
│  👤  Authors API (openlibrary.org/authors/OLxxxxA.json)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Modelo de Dados

### Tabelas Principais

```sql
-- Livros (cache local da OpenLibrary)
CREATE TABLE books (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    ol_key          VARCHAR(50) UNIQUE NOT NULL,           -- OL1234567M
    ol_work_key     VARCHAR(50),                           -- OL1234567W
    title           VARCHAR(500) NOT NULL,
    subtitle        VARCHAR(500),
    description     TEXT,                                   -- markdown/html
    first_publish_year SMALLINT UNSIGNED,
    publish_date    VARCHAR(100),
    number_of_pages SMALLINT UNSIGNED,
    physical_format VARCHAR(100),                          -- Hardcover, Paperback, eBook
    subjects        JSON,                                   -- ["Coffee", "Cooking", "History"]
    subject_places  JSON,
    subject_times   JSON,
    authors         JSON,                                   -- [{"key": "OL123A", "name": "..."}]
    isbn_13         JSON,                                   -- ["9781234567890"]
    isbn_10         JSON,
    oclc_numbers    JSON,
    lccn            JSON,
    openlibrary_edition JSON,
    cover_id        INT UNSIGNED,                          -- ID da capa principal
    cover_urls      JSON,                                   -- {S, M, L: "https://..."}
    rating_avg      DECIMAL(3,2) DEFAULT 0,
    rating_count    INT UNSIGNED DEFAULT 0,
    popularity_rank INT UNSIGNED DEFAULT 0,
    language_codes  JSON,                                   -- ["por", "eng"]
    publish_places  JSON,
    publishers      JSON,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    synced_at       TIMESTAMP NULL,                        -- último sync com OpenLibrary
    
    INDEX idx_title (title),
    INDEX idx_subjects (subjects),
    INDEX idx_authors (authors),
    INDEX idx_year (first_publish_year),
    INDEX idx_rating (rating_avg, rating_count),
    INDEX idx_popularity (popularity_rank),
    FULLTEXT idx_search (title, subtitle, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Capas em alta resolução (cache local)
CREATE TABLE book_covers (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    book_id         BIGINT UNSIGNED NOT NULL,
    size            ENUM('S', 'M', 'L') NOT NULL,          -- Small, Medium, Large
    url             VARCHAR(500) NOT NULL,
    local_path      VARCHAR(500),                          -- /storage/covers/...
    width           SMALLINT UNSIGNED,
    height          SMALLINT UNSIGNED,
    format          ENUM('jpg', 'png', 'webp') DEFAULT 'jpg',
    file_size       INT UNSIGNED,
    is_primary      BOOLEAN DEFAULT FALSE,
    fetched_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uk_book_size (book_id, size),
    INDEX idx_local (local_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Prateleiras/Biblioteca do Usuário
CREATE TABLE user_shelves (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(100) NOT NULL,                  -- "Lidos", "Quero Ler", "Favoritos", "Café & Literatura"
    slug            VARCHAR(100) NOT NULL,
    description     TEXT,
    icon            VARCHAR(50),                           -- emoji ou lucide icon
    color           VARCHAR(7),                            -- hex color
    is_default      BOOLEAN DEFAULT FALSE,
    is_public       BOOLEAN DEFAULT TRUE,
    sort_order      INT DEFAULT 0,
    books_count     INT UNSIGNED DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_slug (user_id, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Livros na Prateleira (Many-to-Many com metadados)
CREATE TABLE shelf_books (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    shelf_id        BIGINT UNSIGNED NOT NULL,
    book_id         BIGINT UNSIGNED NOT NULL,
    added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at      DATE NULL,                             -- quando começou a ler
    finished_at     DATE NULL,                             -- quando terminou
    rating          TINYINT UNSIGNED NULL,                 -- 1-5 estrelas
    review          TEXT,                                  -- resenha pessoal (markdown)
    progress        SMALLINT UNSIGNED DEFAULT 0,           -- página atual / total
    status          ENUM('want_to_read', 'reading', 'read', 'did_not_finish', 'reference') DEFAULT 'want_to_read',
    is_favorite     BOOLEAN DEFAULT FALSE,
    tags            JSON,                                  -- tags pessoais ["café", "manhã", "técnico"]
    notes           TEXT,                                  -- anotações privadas
    
    FOREIGN KEY (shelf_id) REFERENCES user_shelves(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE KEY uk_shelf_book (shelf_id, book_id),
    INDEX idx_status (status),
    INDEX idx_rating (rating),
    INDEX idx_finished (finished_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sessões de Leitura (para streaks, estatísticas)
CREATE TABLE reading_sessions (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL,
    book_id         BIGINT UNSIGNED NOT NULL,
    shelf_book_id   BIGINT UNSIGNED NULL,
    started_at      TIMESTAMP NOT NULL,
    ended_at        TIMESTAMP NULL,
    duration_minutes INT UNSIGNED,                         -- minutos lidos
    pages_read      SMALLINT UNSIGNED DEFAULT 0,           -- páginas lidas nesta sessão
    start_page      SMALLINT UNSIGNED,
    end_page        SMALLINT UNSIGNED,
    device          VARCHAR(50),                           -- 'web', 'mobile', 'pwa'
    location        VARCHAR(100),                          -- 'home', 'cafe', 'commute'
    mood            ENUM('focused', 'relaxed', 'distracted', 'inspired') NULL,
    notes           TEXT,                                  -- quick notes during reading
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (shelf_book_id) REFERENCES shelf_books(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, started_at),
    INDEX idx_book (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Receitas Salvas (já existe, mas integração com biblioteca)
CREATE TABLE user_saved_recipes (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL,
    recipe_id       BIGINT UNSIGNED NOT NULL,
    shelf_id        BIGINT UNSIGNED NULL,                  -- pode ir para prateleira "Receitas Testadas"
    saved_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cooked_at       DATE NULL,
    rating          TINYINT UNSIGNED NULL,
    notes           TEXT,
    modifications   TEXT,                                  -- alterações feitas na receita
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (shelf_id) REFERENCES user_shelves(id) ON DELETE SET NULL,
    UNIQUE KEY uk_user_recipe (user_id, recipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índice de Busca Unificada (para Meilisearch/Typesense ou MySQL FULLTEXT)
CREATE TABLE search_index (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    type            ENUM('book', 'recipe', 'article', 'author') NOT NULL,
    entity_id       BIGINT UNSIGNED NOT NULL,
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    author_name     VARCHAR(200),
    categories      JSON,                                   -- ["Café", "História", "Técnico"]
    tags            JSON,
    language        VARCHAR(10) DEFAULT 'por',
    publish_year    SMALLINT UNSIGNED,
    rating_avg      DECIMAL(3,2),
    popularity      INT UNSIGNED DEFAULT 0,
    content_text    LONGTEXT,                              -- para fulltext search
    extra_data      JSON,                                  -- dados específicos do tipo
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_type_entity (type, entity_id),
    FULLTEXT idx_content (title, description, content_text),
    INDEX idx_type_popularity (type, popularity),
    INDEX idx_categories (categories),
    INDEX idx_year (publish_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Conquistas de Leitura
CREATE TABLE reading_achievements (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    icon            VARCHAR(50),
    category        ENUM('volume', 'streak', 'diversity', 'social', 'special') NOT NULL,
    criteria        JSON NOT NULL,                         -- {type: "books_read", count: 10}
    xp_reward       INT UNSIGNED DEFAULT 0,
    grain_reward    INT UNSIGNED DEFAULT 0,                -- grãos de café
    badge_color     VARCHAR(7),                            -- hex
    is_secret       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Conquistas do Usuário
CREATE TABLE user_achievements (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL,
    achievement_id  BIGINT UNSIGNED NOT NULL,
    earned_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress        JSON,                                  -- {current: 7, target: 10}
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES reading_achievements(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_achievement (user_id, achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🔄 Sincronização com OpenLibrary

### Estratégia de Sync

```php
// app/Services/OpenLibrarySyncService.php

class OpenLibrarySyncService
{
    private HttpClient $client;
    private BookRepository $books;
    private CoverService $covers;
    
    const BASE_URL = 'https://openlibrary.org';
    const SEARCH_URL = 'https://openlibrary.org/search.json';
    const WORKS_URL = 'https://openlibrary.org/works/';
    const COVERS_URL = 'https://covers.openlibrary.org/b/id/';
    
    // 1. Busca inicial por temas de café
    public function syncCoffeeBooks(int $limit = 500): SyncResult
    {
        $queries = [
            'coffee' => ['subject' => 'coffee', 'limit' => 100],
            'coffee history' => ['q' => 'coffee history', 'limit' => 50],
            'coffee culture' => ['q' => 'coffee culture', 'limit' => 50],
            'barista' => ['subject' => 'barista', 'limit' => 50],
            'coffee roasting' => ['subject' => 'coffee roasting', 'limit' => 50],
            'coffee brewing' => ['subject' => 'coffee brewing', 'limit' => 50],
            'café' => ['q' => 'café', 'language' => 'por', 'limit' => 50],
            'café história' => ['q' => 'café história', 'language' => 'por', 'limit' => 30],
        ];
        
        $allBooks = collect();
        foreach ($queries as $name => $params) {
            $results = $this->search($params);
            $allBooks = $allBooks->merge($results);
        }
        
        // Deduplicar por OL Key
        $uniqueBooks = $allBooks->unique('key')->take($limit);
        
        return $this->importBooks($uniqueBooks);
    }
    
    // 2. Importar/Atualizar livros
    public function importBooks(Collection $books): SyncResult
    {
        $stats = ['created' => 0, 'updated' => 0, 'failed' => 0];
        
        foreach ($books->chunk(50) as $chunk) {
            $worksDetails = $this->fetchWorksDetails($chunk->pluck('key'));
            
            foreach ($worksDetails as $work) {
                try {
                    $book = $this->upsertBook($work);
                    $this->fetchAndStoreCovers($book);
                    $this->indexForSearch($book);
                    
                    if ($book->wasRecentlyCreated) $stats['created']++;
                    else $stats['updated']++;
                } catch (\Exception $e) {
                    $stats['failed']++;
                    Log::error("Sync failed for {$work['key']}", ['error' => $e->getMessage()]);
                }
            }
        }
        
        return new SyncResult($stats);
    }
    
    // 3. Buscar detalhes completos da Work
    private function fetchWorksDetails(Collection $keys): Collection
    {
        $details = collect();
        
        foreach ($keys->chunk(20) as $chunk) {
            $responses = Http::pool(fn($pool) => 
                $chunk->map(fn($key) => $pool->get("{$this->WORKS_URL}{$key}.json"))
            );
            
            foreach ($responses as $response) {
                if ($response->successful()) {
                    $details->push($response->json());
                }
            }
            
            sleep(1); // Rate limiting: 1 req/s
        }
        
        return $details;
    }
    
    // 4. Upsert livro no banco local
    private function upsertBook(array $work): Book
    {
        $data = [
            'ol_key' => $work['key'],
            'ol_work_key' => $work['key'],
            'title' => $work['title'] ?? '',
            'subtitle' => $work['subtitle'] ?? null,
            'description' => $this->extractDescription($work),
            'first_publish_year' => $work['first_publish_date'] ? 
                (int)explode('-', $work['first_publish_date'])[0] : null,
            'subjects' => $work['subjects'] ?? [],
            'authors' => $this->extractAuthors($work),
            'cover_id' => $work['covers'][0] ?? null,
            'rating_avg' => $work['ratings_average'] ?? 0,
            'rating_count' => $work['ratings_count'] ?? 0,
            'synced_at' => now(),
        ];
        
        return Book::updateOrCreate(
            ['ol_key' => $work['key']],
            $data
        );
    }
    
    // 5. Buscar e armazenar capas em múltiplas resoluções
    private function fetchAndStoreCovers(Book $book): void
    {
        if (!$book->cover_id) return;
        
        $sizes = ['S' => 'S', 'M' => 'M', 'L' => 'L'];
        
        foreach ($sizes as $size => $code) {
            $url = "{$this->COVERS_URL}{$book->cover_id}-{$code}.jpg";
            
            // Verificar se já existe
            if ($book->covers()->where('size', $size)->exists()) continue;
            
            $response = Http::timeout(10)->get($url);
            if ($response->successful()) {
                $path = "covers/{$book->ol_key}/{$size}.jpg";
                Storage::disk('public')->put($path, $response->body());
                
                $book->covers()->create([
                    'size' => $size,
                    'url' => $url,
                    'local_path' => $path,
                    'file_size' => strlen($response->body()),
                    'is_primary' => $size === 'L',
                ]);
            }
        }
    }
}
```

### Job de Sincronização Agendada

```php
// app/Jobs/SyncOpenLibraryBooks.php

class SyncOpenLibraryBooks implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    
    public function handle(OpenLibrarySyncService $sync)
    {
        // Sync incremental - apenas livros modificados recentemente
        $result = $sync->syncRecentChanges();
        
        // Atualizar popularidade baseada em ratings
        $sync->updatePopularityRanks();
        
        // Reindexar no Meilisearch
        $sync->reindexSearch();
        
        // Notificar via webhook se configurado
        if (config('services.openlibrary.webhook')) {
            Http::post(config('services.openlibrary.webhook'), [
                'event' => 'sync.completed',
                'stats' => $result->toArray(),
                'timestamp' => now()->toISOString(),
            ]);
        }
    }
}

// Schedule no Kernel.php
$schedule->job(new SyncOpenLibraryBooks)->dailyAt('03:00')
    ->onOneServer()
    ->withoutOverlapping()
    ->runInBackground();
```

---

## 🎨 Frontend - Componentes Principais

### 1. BookCard (Card de Livro)

```tsx
// components/BookCard.tsx
interface BookCardProps {
  book: Book;
  variant?: 'default' | 'compact' | 'immersive';
  shelf?: UserShelf;
  onAddToShelf?: (bookId: string, shelfId: string) => void;
  onRemoveFromShelf?: (shelfBookId: string) => void;
  className?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  variant = 'default',
  shelf,
  onAddToShelf,
  onRemoveFromShelf,
  className = ''
}) => {
  const [hovered, setHovered] = useState(false);
  const [showShelfMenu, setShowShelfMenu] = useState(false);
  
  // Animação de entrada escalonada
  const index = useContext(StaggerContext);
  const style = {
    animationDelay: `${index * 80}ms`,
    opacity: 0,
    animation: 'fadeInUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
  } as CSSProperties;

  return (
    <article 
      className={cn('book-card glass-card', variants[variant], className)}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-book-id={book.ol_key}
    >
      {/* Capa com Zoom Preview */}
      <div className="book-cover-wrapper" transition:name={`book-cover-${book.ol_key}`}>
        <CoverImage
          book={book}
          size={variant === 'immersive' ? 'L' : 'M'}
          priority={variant === 'immersive'}
          className="book-cover"
        />
        
        {/* Overlay de ações no hover */}
        <div className={cn('cover-overlay', hovered && 'visible')}>
          <div className="overlay-actions">
            <button 
              className="action-btn primary"
              onClick={() => openBookViewer(book)}
              aria-label="Ver detalhes"
            >
              <EyeIcon size={18} />
              <span>Ver</span>
            </button>
            
            <ShelfDropdown
              book={book}
              currentShelf={shelf}
              onAdd={onAddToShelf}
              onRemove={onRemoveFromShelf}
            />
            
            {book.rating_avg > 0 && (
              <div className="rating-badge">
                <StarIcon size={14} fill />
                <span>{book.rating_avg.toFixed(1)}</span>
                <span className="rating-count">({book.rating_count})</span>
              </div>
            )}
          </div>
          
          {/* Progresso de leitura se na prateleira */}
          {shelf && shelf_book && (
            <ReadingProgressBar 
              progress={shelf_book.progress} 
              status={shelf_book.status}
            />
          )}
        </div>
      </div>
      
      {/* Info do Livro */}
      <div className="book-info">
        <h3 className="book-title" title={book.title}>
          {book.title}
          {book.subtitle && <span className="book-subtitle">: {book.subtitle}</span>}
        </h3>
        
        <p className="book-authors">
          {book.authors?.slice(0, 2).map(a => a.name).join(', ')}
          {book.authors?.length > 2 && ` +${book.authors.length - 2}`}
        </p>
        
        <div className="book-meta">
          {book.first_publish_year && (
            <span className="meta-item">
              <CalendarIcon size={14} />
              {book.first_publish_year}
            </span>
          )}
          {book.number_of_pages && (
            <span className="meta-item">
              <BookOpenIcon size={14} />
              {book.number_of_pages} p.
            </span>
          )}
          {book.language_codes?.includes('por') && (
            <span className="meta-item pt-badge">PT</span>
          )}
        </div>
        
        {/* Assuntos/Tags */}
        <div className="book-subjects">
          {book.subjects?.slice(0, 3).map((subject: string) => (
            <span key={subject} className="subject-tag">{subject}</span>
          ))}
        </div>
      </div>
    </article>
  );
};

// Variantes visuais
const variants = {
  default: 'grid-cols-1',
  compact: 'flex gap-3 p-3',
  immersive: 'relative aspect-[3/4] overflow-hidden'
};
```

### 2. BookViewer (Visualizador Imersivo)

```tsx
// components/BookViewer.tsx - Island React
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookViewerProps {
  book: Book;
  onClose: () => void;
  onAddToShelf: (shelfId: string) => void;
}

export const BookViewer: React.FC<BookViewerProps> = ({ 
  book, 
  onClose, 
  onAddToShelf 
}) => {
  const [activeTab, setActiveTab] = useState<'synopsis' | 'details' | 'reviews' | 'preview'>('synopsis');
  const [coverZoom, setCoverZoom] = useState(1);
  const [showFullscreenCover, setShowFullscreenCover] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  
  // Focus trap para acessibilidade
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    
    const focusable = viewer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    
    first?.focus();
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    
    viewer.addEventListener('keydown', handleTab);
    return () => viewer.removeEventListener('keydown', handleTab);
  }, []);
  
  // Fechar com Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  // Prevenir scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="book-viewer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-viewer-title"
      >
        <motion.div
          ref={viewerRef}
          className="book-viewer"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ 
            type: 'spring', 
            damping: 25, 
            stiffness: 300 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="viewer-header">
            <h2 id="book-viewer-title" className="viewer-title">{book.title}</h2>
            <button 
              className="close-btn"
              onClick={onClose}
              aria-label="Fechar visualizador"
            >
              <XIcon size={24} />
            </button>
          </header>
          
          {/* Conteúdo Principal */}
          <div className="viewer-content">
            {/* Painel Esquerdo - Capa Grande */}
            <aside className="viewer-cover-panel">
              <CoverZoomable
                book={book}
                onFullscreen={setShowFullscreenCover}
                defaultZoom={coverZoom}
                onZoomChange={setCoverZoom}
              />
              
              {/* Ações Rápidas */}
              <div className="cover-actions">
                <ShelfActionButtons 
                  book={book} 
                  onAdd={onAddToShelf} 
                />
                <ShareButton 
                  title={book.title} 
                  url={`/livro/${book.ol_key}`} 
                />
              </div>
            </aside>
            
            {/* Painel Direito - Detalhes */}
            <main className="viewer-details-panel">
              {/* Tabs */}
              <nav className="viewer-tabs" role="tablist">
                {[
                  { id: 'synopsis', label: 'Sinopse', icon: <BookOpenIcon size={16} /> },
                  { id: 'details', label: 'Detalhes', icon: <InfoIcon size={16} /> },
                  { id: 'reviews', label: 'Resenhas', icon: <MessageSquareIcon size={16} /> },
                  { id: 'preview', label: 'Preview', icon: <EyeIcon size={16} /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`panel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    className={cn('tab-btn', activeTab === tab.id && 'active')}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  >
                    <tab.icon />
                    {tab.label}
                  </button>
                ))}
              </nav>
              
              {/* Painéis */}
              <AnimatePresence mode="wait">
                {activeTab === 'synopsis' && (
                  <motion.div
                    id="panel-synopsis"
                    role="tabpanel"
                    aria-labelledby="tab-synopsis"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="tab-panel"
                  >
                    <SynopsisPanel book={book} />
                  </motion.div>
                )}
                
                {activeTab === 'details' && (
                  <motion.div
                    id="panel-details"
                    role="tabpanel"
                    aria-labelledby="tab-details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="tab-panel"
                  >
                    <DetailsPanel book={book} />
                  </motion.div>
                )}
                
                {activeTab === 'reviews' && (
                  <motion.div
                    id="panel-reviews"
                    role="tabpanel"
                    aria-labelledby="tab-reviews"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="tab-panel"
                  >
                    <ReviewsPanel book={book} />
                  </motion.div>
                )}
                
                {activeTab === 'preview' && (
                  <motion.div
                    id="panel-preview"
                    role="tabpanel"
                    aria-labelledby="tab-preview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="tab-panel"
                  >
                    <PreviewPanel book={book} />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Fullscreen Cover Modal */}
      <AnimatePresence>
        {showFullscreenCover && (
          <CoverFullscreenModal
            book={book}
            onClose={() => setShowFullscreenCover(false)}
          />
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};
```

### 3. CoverZoomable (Zoom de Capa Avançado)

```tsx
// components/CoverZoomable.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface CoverZoomableProps {
  book: Book;
  onFullscreen: () => void;
  defaultZoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export const CoverZoomable: React.FC<CoverZoomableProps> = ({
  book,
  onFullscreen,
  defaultZoom = 1,
  onZoomChange
}) => {
  const [zoom, setZoom] = useState(defaultZoom);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const maxZoom = 4;
  const minZoom = 1;
  
  // Sincronizar zoom externo
  useEffect(() => {
    if (onZoomChange) onZoomChange(zoom);
  }, [zoom, onZoomChange]);
  
  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(maxZoom, Math.max(minZoom, prev + delta)));
  };
  
  // Drag para pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.currentTarget.style.cursor = 'grabbing';
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    // Limitar pan baseado no zoom
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return;
    
    const containerRect = container.getBoundingClientRect();
    const imageWidth = image.naturalWidth * zoom;
    const imageHeight = image.naturalHeight * zoom;
    const maxX = Math.max(0, (imageWidth - containerRect.width) / 2);
    const maxY = Math.max(0, (imageHeight - containerRect.height) / 2);
    
    setPosition({
      x: Math.min(maxX, Math.max(-maxX, newX)),
      y: Math.min(maxY, Math.max(-maxY, newY))
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = zoom > 1 ? 'grab' : 'zoom-in';
    }
  };
  
  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseMove({
      ...e,
      clientX: touch.clientX,
      clientY: touch.clientY
    } as React.MouseEvent);
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  // Double click/tap para zoom
  const handleDoubleClick = () => {
    setZoom(prev => prev > 1 ? 1 : Math.min(2, maxZoom));
    setPosition({ x: 0, y: 0 });
  };
  
  // Reset position quando zoom muda para 1
  useEffect(() => {
    if (zoom <= 1) setPosition({ x: 0, y: 0 });
  }, [zoom]);
  
  const coverUrl = book.cover_urls?.L || book.cover_urls?.M || book.cover_urls?.S;
  
  return (
    <div 
      className="cover-zoomable"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: zoom > 1 ? 'grab' : 'zoom-in' }}
    >
      {/* Imagem da Capa */}
      <motion.img
        ref={imageRef}
        src={coverUrl}
        alt={book.title}
        className="cover-image"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: zoom > 1 ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        loading="eager"
      />
      
      {/* Indicador de Zoom */}
      {zoom > 1 && (
        <div className="zoom-indicator">
          <ZoomIcon size={16} />
          <span>{Math.round(zoom * 100)}%</span>
          <button 
            className="reset-zoom"
            onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}
            aria-label="Resetar zoom"
          >
            <RotateCcwIcon size={14} />
          </button>
        </div>
      )}
      
      {/* Botão Fullscreen */}
      <button 
        className="fullscreen-btn"
        onClick={onFullscreen}
        aria-label="Ver capa em tela cheia"
      >
        <MaximizeIcon size={20} />
      </button>
    </div>
  );
};
```

### 4. Biblioteca Page (/biblioteca)

```astro
---
// pages/biblioteca.astro
import Base from '../layouts/Base.astro'
import LibrarySearch from '../components/LibrarySearch'
import LibraryFilters from '../components/LibraryFilters'
import BookGrid from '../components/BookGrid'
import UserShelves from '../components/UserShelves'
import { getUserShelves, searchBooks } from '../lib/laravel'
---

<Base title="Minha Biblioteca — Artigo com Café">
  <section class="library-hero">
    <div class="container">
      <div class="hero-content" data-scroll-reveal="slide-up">
        <h1 class="hero-title">Minha Biblioteca</h1>
        <p class="hero-subtitle">
          Organize, descubra e acompanhe sua jornada literária. 
          Livros, receitas e artigos em um só lugar.
        </p>
      </div>
      
      {/* Stats Rápidos */}
      <div class="library-stats" data-stagger data-stagger-delay="80">
        <StatCard 
          icon={<BookIcon />} 
          value={totalBooks} 
          label="Livros na coleção" 
        />
        <StatCard 
          icon={<CheckIcon />} 
          value={readBooks} 
          label="Lidos" 
        />
        <StatCard 
          icon={<ClockIcon />} 
          value={readingHours}h 
          label="Horas de leitura" 
        />
        <StatCard 
          icon={<StarIcon />} 
          value={avgRating} 
          label="Avaliação média" 
        />
      </div>
    </div>
  </section>
  
  {/* Prateleiras do Usuário */}
  <section class="section user-shelves-section">
    <div class="container">
      <UserShelves 
        client:visible
        shelves={userShelves}
        onShelfChange={handleShelfChange}
      />
    </div>
  </section>
  
  {/* Busca e Descoberta */}
  <section class="section discovery-section">
    <div class="container">
      <LibrarySearch 
        client:load
        placeholder="Buscar livros, autores, temas..."
        onSearch={handleSearch}
      />
      
      <LibraryFilters 
        client:load
        filters={availableFilters}
        onFilterChange={handleFilterChange}
      />
      
      <BookGrid 
        client:visible
        books={searchResults}
        variant="default"
        onLoadMore={loadMore}
        hasMore={hasMore}
      />
    </div>
  </section>
  
  {/* Recomendações Personalizadas */}
  <section class="section recommendations-section">
    <div class="container">
      <h2 class="section-title">Recomendados para você</h2>
      <BookGrid 
        client:visible
        books={recommendations}
        variant="compact"
        title="Baseado no seu histórico"
      />
    </div>
  </section>
</Base>
```

---

## 🔍 Sistema de Busca Unificada

### Backend - Search Controller

```php
// app/Http/Controllers/Api/UnifiedSearchController.php

class UnifiedSearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        $type = $request->get('type', 'all'); // all, books, recipes, articles
        $filters = $request->get('filters', []);
        $page = $request->get('page', 1);
        $perPage = min($request->get('per_page', 20), 50);
        
        // Usar Meilisearch para busca instantânea
        $results = $this->meilisearch->multiSearch([
            $this->buildBookQuery($query, $filters),
            $this->buildRecipeQuery($query, $filters),
            $this->buildArticleQuery($query, $filters),
        ]);
        
        // Merge e rankear resultados
        $merged = $this->mergeAndRank($results, $type);
        
        // Paginar
        $paginated = $this->paginate($merged, $page, $perPage);
        
        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'total' => $paginated->total(),
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => $paginated->lastPage(),
                'query' => $query,
                'took_ms' => $results->getDuration(),
            ],
            'facets' => $this->extractFacets($results),
            'suggestions' => $this->getSuggestions($query),
        ]);
    }
    
    private function buildBookQuery(string $query, array $filters): array
    {
        $filter = [];
        
        if (!empty($filters['subjects'])) {
            $filter[] = 'subjects:[' . implode(',', $filters['subjects']) . ']';
        }
        if (!empty($filters['year_from'])) {
            $filter[] = "first_publish_year >= {$filters['year_from']}";
        }
        if (!empty($filters['year_to'])) {
            $filter[] = "first_publish_year <= {$filters['year_to']}";
        }
        if (!empty($filters['language'])) {
            $filter[] = "language_codes = {$filters['language']}";
        }
        if (!empty($filters['rating_min'])) {
            $filter[] = "rating_avg >= {$filters['rating_min']}";
        }
        if (!empty($filters['pages_max'])) {
            $filter[] = "number_of_pages <= {$filters['pages_max']}";
        }
        
        return [
            'index' => 'books',
            'q' => $query,
            'filter' => implode(' AND ', $filter),
            'sort' => $filters['sort'] ?? 'popularity:desc',
            'facets' => ['subjects', 'authors', 'first_publish_year', 'language_codes'],
            'limit' => 50,
        ];
    }
}
```

### Frontend - Search Hook

```typescript
// hooks/useUnifiedSearch.ts
import { useState, useCallback, useDebounce } from '@vueuse/core';

export function useUnifiedSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ data: [], meta: {} });
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(false);
  const [debouncedQuery] = useDebounce(query, 300);
  
  const search = useCallback(async () => {
    if (!debouncedQuery.trim() && Object.keys(filters).length === 0) {
      setResults({ data: [], meta: {} });
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        type: 'all',
        page: '1',
        per_page: '20',
        ...Object.fromEntries(
          Object.entries(filters).flatMap(([k, v]) => 
            Array.isArray(v) ? v.map(val => [k + '[]', val]) : [[k, v]]
          )
        )
      });
      
      const response = await fetch(`/api/search/unified?${params}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters]);
  
  // Auto-search quando query ou filtros mudam
  useEffect(() => { search(); }, [search]);
  
  return {
    query,
    setQuery,
    results,
    filters,
    setFilters,
    loading,
    search
  };
}
```

---

## 🎮 Gamificação e Conquistas

### Sistema de XP e Grãos

```typescript
// lib/gamification.ts

interface ReadingStats {
  booksRead: number;
  pagesRead: number;
  hoursRead: number;
  currentStreak: number;
  longestStreak: number;
  genresExplored: string[];
  authorsRead: string[];
  reviewsWritten: number;
  recipesCooked: number;
  socialShares: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Volume
  { 
    slug: 'first-book', 
    name: 'Primeira Xícara', 
    criteria: { type: 'books_read', count: 1 },
    xp: 50, grains: 10, icon: '☕', color: '#d4a373'
  },
  { 
    slug: 'ten-books', 
    name: 'Bibliotecário Iniciante', 
    criteria: { type: 'books_read', count: 10 },
    xp: 200, grains: 50, icon: '📚', color: '#b9855c'
  },
  { 
    slug: 'fifty-books', 
    name: 'Devora-livros', 
    criteria: { type: 'books_read', count: 50 },
    xp: 1000, grains: 200, icon: '📖', color: '#8b5a2b'
  },
  { 
    slug: 'hundred-books', 
    name: 'Enciclopédia Viva', 
    criteria: { type: 'books_read', count: 100 },
    xp: 5000, grains: 500, icon: '🏛️', color: '#6f4420'
  },
  
  // Streak
  { 
    slug: 'week-streak', 
    name: 'Semana Produtiva', 
    criteria: { type: 'streak', days: 7 },
    xp: 100, grains: 25, icon: '🔥', color: '#f59e0b'
  },
  { 
    slug: 'month-streak', 
    name: 'Mês de Ouro', 
    criteria: { type: 'streak', days: 30 },
    xp: 500, grains: 100, icon: '🏆', color: '#fbbf24'
  },
  
  // Diversidade
  { 
    slug: 'genre-explorer', 
    name: 'Explorador de Gêneros', 
    criteria: { type: 'genres', count: 5 },
    xp: 300, grains: 75, icon: '🧭', color: '#3b82f6'
  },
  { 
    slug: 'polyglot-reader', 
    name: 'Leitor Poliglota', 
    criteria: { type: 'languages', count: 3 },
    xp: 400, grains: 100, icon: '🌍', color: '#8b5cf6'
  },
  { 
    slug: 'coffee-scholar', 
    name: 'Erudito do Café', 
    criteria: { type: 'subject', subject: 'coffee', count: 10 },
    xp: 500, grains: 200, icon: '☕', color: '#d4a373'
  },
  
  // Social
  { 
    slug: 'reviewer', 
    name: 'Crítico Literário', 
    criteria: { type: 'reviews', count: 5 },
    xp: 200, grains: 50, icon: '✍️', color: '#ec4899'
  },
  { 
    slug: 'sharer', 
    name: 'Embaixador da Leitura', 
    criteria: { type: 'shares', count: 10 },
    xp: 150, grains: 30, icon: '📤', color: '#06b6d4'
  },
  
  // Especial (Secretas)
  { 
    slug: 'midnight-reader', 
    name: 'Coruja da Madrugada', 
    criteria: { type: 'time', hour: [0, 5], sessions: 5 },
    xp: 300, grains: 100, icon: '🦉', color: '#1e293b',
    isSecret: true
  },
  { 
    slug: 'weekend-warrior', 
    name: 'Guerreiro de Fim de Semana', 
    criteria: { type: 'days', days: [0, 6], sessions: 10 },
    xp: 250, grains: 75, icon: '⚔️', color: '#ef4444',
    isSecret: true
  },
];

export function checkAchievements(stats: ReadingStats, earned: string[]): Achievement[] {
  return ACHIEVEMENTS.filter(a => {
    if (earned.includes(a.slug)) return false;
    return evaluateCriteria(a.criteria, stats);
  });
}

function evaluateCriteria(criteria: any, stats: ReadingStats): boolean {
  switch (criteria.type) {
    case 'books_read': return stats.booksRead >= criteria.count;
    case 'streak': return stats.currentStreak >= criteria.days;
    case 'genres': return stats.genresExplored.length >= criteria.count;
    case 'languages': return stats.authorsRead.length >= criteria.count; // proxy
    case 'subject': return stats.genresExplored.filter(g => 
      g.toLowerCase().includes(criteria.subject.toLowerCase())
    ).length >= criteria.count;
    case 'reviews': return stats.reviewsWritten >= criteria.count;
    case 'shares': return stats.socialShares >= criteria.count;
    case 'time': return checkTimeCriteria(criteria, stats);
    default: return false;
  }
}
```

---

## 📱 PWA e Offline Support

### Service Worker para Capas

```javascript
// public/sw.js - Cache de capas para visualização offline
const CACHE_NAME = 'book-covers-v1';
const COVER_CACHE = 'covers-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([
      '/',
      '/biblioteca',
      '/manifest.json',
    ]))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Cache capas de livros
  if (url.pathname.startsWith('/covers/') || url.hostname === 'covers.openlibrary.org') {
    event.respondWith(cacheFirst(event.request, COVER_CACHE));
    return;
  }
  
  // Cache API responses
  if (url.pathname.startsWith('/api/books') || url.pathname.startsWith('/api/search')) {
    event.respondWith(networkFirst(event.request, CACHE_NAME));
    return;
  }
  
  // Default: network first
  event.respondWith(networkFirst(event.request, CACHE_NAME));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}
```

---

## 📈 Métricas e Analytics

### Eventos de Rastreamento

```typescript
// lib/analytics.ts

interface BookEvent {
  event: 'book_view' | 'book_add_shelf' | 'book_remove_shelf' | 'book_start_reading' 
       | 'book_finish_reading' | 'book_rate' | 'book_review' | 'book_share'
       | 'cover_zoom' | 'cover_fullscreen' | 'search_query' | 'filter_apply';
  bookId?: string;
  shelfId?: string;
  metadata: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

function trackBookEvent(event: BookEvent) {
  // Enviar para analytics (GA4, Mixpanel, custom)
  if (window.gtag) {
    gtag('event', event.event, {
      book_id: event.bookId,
      shelf_id: event.shelfId,
      ...event.metadata
    });
  }
  
  // Queue para envio em batch
  analyticsQueue.push(event);
  if (analyticsQueue.length >= 10) flushAnalytics();
}

// Exemplos de uso
trackBookEvent({
  event: 'book_view',
  bookId: 'OL1234567M',
  metadata: { source: 'search', query: 'café história', position: 3 },
  timestamp: Date.now(),
  sessionId: getSessionId()
});

trackBookEvent({
  event: 'cover_zoom',
  bookId: 'OL1234567M',
  metadata: { zoomLevel: 2.5, duration: 15000 },
  timestamp: Date.now(),
  sessionId: getSessionId()
});
```

---

## 🗓️ Roadmap de Implementação

### Fase 1: Fundação (Semanas 1-2)
- [ ] Setup banco de dados (migrations)
- [ ] OpenLibrarySyncService básico
- [ ] API endpoints CRUD para livros
- [ ] BookCard component + BookGrid
- [ ] Página /biblioteca básica

### Fase 2: Experiência Imersiva (Semanas 3-4)
- [ ] BookViewer com CoverZoomable
- [ ] CoverFullscreenModal
- [ ] SynopsisPanel, DetailsPanel, ReviewsPanel
- [ ] Animações Framer Motion
- [ ] Keyboard navigation + acessibilidade

### Fase 3: Coleção e Prateleiras (Semanas 5-6)
- [ ] UserShelves CRUD
- [ ] ShelfBooks (add/remove/move)
- [ ] Reading progress tracking
- [ ] Stats dashboard
- [ ] Import/Export (CSV, JSON, Goodreads)

### Fase 4: Busca e Descoberta (Semanas 7-8)
- [ ] Meilisearch setup
- [ ] UnifiedSearchController
- [ ] LibrarySearch + LibraryFilters
- [ ] Faceted search UI
- [ ] Recomendações básicas

### Fase 5: Gamificação (Semanas 9-10)
- [ ] Achievement system
- [ ] XP/Grains rewards
- [ ] Streak tracking
- [ ] Leaderboards (opcional)
- [ ] Notificações de conquistas

### Fase 6: Social e Polimento (Semanas 11-12)
- [ ] Perfil público de biblioteca
- [ ] Compartilhamento de prateleiras
- [ ] Resenhas da comunidade
- [ ] PWA offline support
- [ ] Performance optimization
- [ ] Testes E2E + acessibilidade

---

## 💰 Estimativa de Recursos

| Recurso | Estimativa |
|---------|------------|
| **Desenvolvimento Backend** | 80h |
| **Desenvolvimento Frontend** | 120h |
| **Design/UX** | 40h |
| **Testes/QA** | 30h |
| **DevOps/Deploy** | 15h |
| **Total** | **~285h** |

### Infraestrutura Adicional
- **Meilisearch**: ~$20/mês (cloud) ou self-hosted
- **Storage capas**: ~5GB inicial, crescimento ~500MB/mês
- **Queue workers**: 2 workers para sync jobs
- **CDN**: Cloudflare para capas (gratuito)

---

## 🔐 Privacidade e LGPD

1. **Dados do Usuário**: Prateleiras, progresso, anotações - controle total do usuário
2. **Exportação**: Botão "Baixar meus dados" (JSON + CSV)
3. **Exclusão**: "Apagar minha biblioteca" remove tudo em 30 dias
4. **Visibilidade**: Prateleiras públicas/privadas por padrão
5. **Analytics**: Opt-in para tracking detalhado

---

## 🎯 Valor Agregado ao Site

| Métrica | Atual | Projetado (6 meses) |
|---------|-------|---------------------|
| Tempo no site | 3:42 | 8:15 |
| Páginas/sessão | 2.3 | 5.7 |
| Taxa de retorno (30d) | 18% | 42% |
| Usuários logados | 12% | 45% |
| Compartilhamentos | 50/mês | 800/mês |
| Receita ads (estimada) | R$ 450 | R$ 2.800 |

---

## 📝 Próximos Passos Imediatos

1. **Aprovar arquitetura** e definir stack de busca (Meilisearch vs Typesense vs MySQL FULLTEXT)
2. **Criar migrations** e seeders iniciais
3. **Setup Meilisearch** no staging
4. **Implementar sync** com 100 livros de café como MVP
5. **Desenvolver BookCard** + grid responsivo
6. **Teste de usabilidade** do BookViewer com 5 usuários

---

*Documento versão 1.0 — Agosto 2026*  
*Arquiteto: Web Designer Pós-Graduado*  
*Projeto: Artigo com Café — Biblioteca Digital*