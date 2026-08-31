import { useState } from 'react'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  count?: number
}

const categories: Category[] = [
  { id: 'feed', name: 'Feed', icon: '📰', color: '#d4a373' },
  { id: 'tecnologia', name: 'Tecnologia', icon: '💻', color: '#3b82f6' },
  { id: 'financas', name: 'Finanças', icon: '📈', color: '#10b981' },
  { id: 'educacao', name: 'Educação', icon: '🎓', color: '#8b5cf6' },
  { id: 'produtividade', name: 'Produtividade', icon: '⚡', color: '#f59e0b' },
  { id: 'receitas', name: 'Receitas', icon: '🍳', color: '#ef4444' },
  { id: 'livros', name: 'Livros', icon: '📚', color: '#06b6d4' },
  { id: 'cafe', name: 'Café', icon: '☕', color: '#b9855c' },
]

export default function CategoryNav() {
  const [activeCategory, setActiveCategory] = useState('feed')

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId)
    // Navigate to category
    if (categoryId === 'feed') {
      window.location.href = '/#feed'
    } else if (categoryId === 'receitas') {
      window.location.href = '/receitas'
    } else if (categoryId === 'livros') {
      window.location.href = '/livros'
    } else {
      window.location.href = `/blog?categoria=${categoryId}`
    }
  }

  return (
    <>
    <nav className="category-nav" aria-label="Navegação por categorias">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`category-nav-item ${activeCategory === category.id ? 'active' : ''}`}
          onClick={() => handleCategoryClick(category.id)}
          style={{ '--category-color': category.color } as React.CSSProperties}
        >
          <span className="category-nav-icon">{category.icon}</span>
          <span className="category-nav-label">{category.name}</span>
        </button>
      ))}
    </nav>

      <style>{`
        .category-nav {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.35rem;
          background: var(--color-bg-card);
          border-radius: 100px;
          border: 1px solid var(--color-bg-card-border);
          padding: 0.4rem 0.65rem;
          overflow: hidden;
        }

        .category-nav-list {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 0.35rem;
          padding: 0.5rem 0.65rem;
        }

        .category-nav-item {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.7rem;
          border: none;
          background: transparent;
          border-radius: 100px;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
          text-align: left;
          white-space: nowrap;
          border: 1px solid var(--color-bg-card-border);
        }

        .category-nav-item:hover {
          background: var(--color-bg-secondary);
        }

        .category-nav-item.active {
          background: var(--category-color);
          border-color: var(--category-color);
        }

        .category-nav-item.active .category-nav-label {
          color: var(--color-btn-text);
          font-weight: 600;
        }

        .category-nav-item.active .category-nav-icon {
          filter: none;
        }

        .category-nav-indicator {
          display: none;
        }

        .category-nav-icon {
          font-size: 1.1rem;
          width: 1.5rem;
          text-align: center;
          flex-shrink: 0;
        }

        .category-nav-label {
          flex: 1;
          font-size: 0.84rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: color 0.15s;
        }

        .category-nav-count {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--color-text-muted);
          background: var(--color-bg-secondary);
          padding: 0.15rem 0.5rem;
          border-radius: 100px;
        }

        .category-nav-item.active .category-nav-count {
          background: color-mix(in srgb, var(--category-color) 20%, transparent);
          color: var(--category-color);
        }
      `}</style>
    </>
  )
}
