import { useState } from 'react'
import '../styles/category-nav.css'

interface Category {
  id: string
  name: string
  icon: string
  color: string
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
  )
}
