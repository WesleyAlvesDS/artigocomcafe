import { useState, useEffect } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return base || 'section'
}

export default function ArticleToc() {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll('.article-content h2, .article-content h3')
    ) as HTMLElement[]

    const toc = headings.map((h, i) => {
      if (!h.id) {
        const base = slugify(h.textContent || 'section')
        const unique = document.getElementById(base) ? `${base}-${i}` : base
        h.id = unique
      }
      return { id: h.id, text: h.textContent || '', level: h.tagName === 'H2' ? 2 : 3 }
    })

    setItems(toc)

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id)
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: [0, 0.1, 0.5] }
    )

    headings.forEach(h => observer.observe(h))
    return () => observer.disconnect()
  }, [])

  if (items.length === 0) return null

  return (
    <nav aria-label="Índice do artigo">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {items.map(item => (
          <li key={item.id} style={{ paddingLeft: item.level === 3 ? '0.75rem' : 0 }}>
            <a
              href={`#${item.id}`}
              class="toc-link"
              data-active={activeId === item.id}
              onClick={() => setActiveId(item.id)}
              style={{
                display: 'block',
                fontSize: '0.82rem',
                lineHeight: '1.45',
                padding: '0.3rem 0.5rem',
                borderRadius: '8px',
                color: activeId === item.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                background: activeId === item.id ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
                textDecoration: 'none',
                borderLeft: `2px solid ${activeId === item.id ? 'var(--color-accent)' : 'transparent'}`,
                transition: 'all 0.25s',
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
