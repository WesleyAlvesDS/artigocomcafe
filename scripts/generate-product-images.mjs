/**
 * Gera os placeholders SVG dos produtos da loja em public/images/products/.
 *
 * Como os produtos ainda não têm fotos reais, cada produto recebe um SVG
 * temático (gradiente café + emoji + nome) que pode ser substituído depois
 * por uma foto real — basta trocar o arquivo ou o campo `image` em
 * src/data/products.ts.
 *
 * Uso: node scripts/generate-product-images.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Emoji + paleta por produto (mesmos dados de src/data/products.ts)
const products = [
  { slug: 'v60-dripper', name: 'V60 Dripper', emoji: '⚗️', hue: 30 },
  { slug: 'prensa-francesa', name: 'Prensa Francesa', emoji: '☕', hue: 18 },
  { slug: 'moedor-manual', name: 'Moedor Manual', emoji: '🫘', hue: 24 },
  { slug: 'balanca-precisao', name: 'Balança de Precisão', emoji: '⚖️', hue: 12 },
  { slug: 'chaleira-ganso', name: 'Chaleira Bico de Ganso', emoji: '🫖', hue: 34 },
  { slug: 'filtros-v60-100', name: 'Filtros V60', emoji: '🍃', hue: 20 },
  { slug: 'cafe-especial-250g', name: 'Café Especial 250g', emoji: '🫘', hue: 26 },
  { slug: 'kit-iniciante', name: 'Kit Iniciante', emoji: '🧰', hue: 16 },
  { slug: 'camiseta-logo-preta', name: 'Camiseta Logo Preta', emoji: '👕', hue: 22 },
  { slug: 'camiseta-logo-branca', name: 'Camiseta Logo Branca', emoji: '👕', hue: 40 },
  { slug: 'caneca-ceramica', name: 'Caneca Cerâmica', emoji: '☕', hue: 28 },
  { slug: 'moletom-conforto', name: 'Moletom Conforto', emoji: '🧥', hue: 14 },
  { slug: 'bone-dad-hat', name: 'Boné Dad Hat', emoji: '🧢', hue: 32 },
  { slug: 'ecobag-algodao', name: 'Ecobag Algodão Cru', emoji: '👜', hue: 36 },
  { slug: 'poster-cafe-manha', name: 'Poster Ritual da Manhã', emoji: '🖼️', hue: 38 },
  { slug: 'caderno-pontos', name: 'Caderno Pontos', emoji: '📓', hue: 10 },
  { slug: 'kit-ritual-manha', name: 'Kit Ritual da Manhã', emoji: '🌅', hue: 25 },
  { slug: 'kit-leitura-conforto', name: 'Kit Leitura & Conforto', emoji: '📚', hue: 15 },
  { slug: 'kit-barista-iniciante', name: 'Kit Barista Iniciante', emoji: '🧑‍🍳', hue: 21 },
  { slug: 'kit-presente-completo', name: 'Kit Presente Completo', emoji: '🎁', hue: 27 },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function svg({ name, emoji, hue }) {
  const c1 = `hsl(${hue}, 45%, 32%)`
  const c2 = `hsl(${hue + 18}, 55%, 14%)`
  const accent = `hsl(${hue + 8}, 60%, 62%)`
  const grain = Array.from({ length: 14 }, (_, i) => {
    const x = 40 + ((i * 173) % 720)
    const y = 40 + ((i * 97) % 720)
    return `<circle cx="${x}" cy="${y}" r="${2 + (i % 3)}" fill="rgba(255,255,255,0.05)" />`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}" />
      <stop offset="1" stop-color="${c2}" />
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.5" />
      <stop offset="1" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)" />
  <rect width="800" height="800" fill="url(#glow)" />
  ${grain}
  <circle cx="400" cy="380" r="150" fill="rgba(10,8,5,0.28)" />
  <circle cx="400" cy="380" r="128" fill="rgba(255,255,255,0.08)" />
  <text x="400" y="430" font-size="150" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  <text x="400" y="610" font-family="Montserrat, Arial, sans-serif" font-size="44" font-weight="800" fill="#f8f5f0" text-anchor="middle" letter-spacing="1">${esc(name)}</text>
  <text x="400" y="660" font-family="Montserrat, Arial, sans-serif" font-size="22" font-weight="500" fill="#e8d5c4" text-anchor="middle" letter-spacing="4">ARTIGO COM CAFÉ</text>
  <rect x="340" y="688" width="120" height="3" rx="1.5" fill="${accent}" />
</svg>
`
}

const outDir = join(root, 'public', 'images', 'products')
mkdirSync(outDir, { recursive: true })

for (const p of products) {
  const file = join(outDir, `${p.slug}.svg`)
  writeFileSync(file, svg(p), 'utf8')
  console.log(`✔ ${p.slug}.svg`)
}

console.log(`\n${products.length} SVGs gerados em public/images/products/`)
