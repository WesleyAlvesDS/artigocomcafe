export interface NavLink {
  label: string
  href: string
  page: string
  icon?: string
  /** Marca a seção como restrita ao usuário autenticado (mobile) */
  userOnly?: boolean
}

export interface NavDropdown {
  label: string
  href: string
  page: string
  dropdown: true
  title: string
  allLabel: string
  fallback: { icon: string; name: string; note: string }
  foot: { icon: string; label: string; href?: string }[]
}

export type NavItem = NavLink | NavDropdown

export interface MobileSection {
  label?: string
  items: NavLink[]
}

/** Navegação principal (desktop) — ordem exibida no topo. */
export const mainNav: NavItem[] = [
  { label: 'Início', href: '/', page: 'home' },
  { label: 'Blog', href: '/blog', page: 'blog' },
  {
    label: 'Receitas',
    href: '/receitas',
    page: 'receitas',
    dropdown: true,
    title: 'Explore receitas',
    allLabel: 'Ver todas →',
    fallback: { icon: '🍽️', name: 'Todas as receitas', note: 'Explore o acervo completo' },
    foot: [
      { icon: '🕐', label: 'Receita do Dia' },
      { icon: '🍳', label: 'Receitas para o café' },
      { icon: '🥐', label: 'Café da manhã', href: '/cafe-da-manha/' },
      { icon: '🥤', label: 'Bebidas' },
    ],
  },
  { label: 'Livros', href: '/livros', page: 'livros' },
  { label: 'Loja', href: '/loja', page: 'loja' },
  { label: 'Sobre', href: '/sobre', page: 'sobre' },
  { label: 'Contato', href: '/contato', page: 'contato' },
]

/** Menu mobile — seções agrupadas (público + área do usuário). */
export const mobileSections: MobileSection[] = [
  {
    items: [
      { label: 'Início', href: '/', page: 'home' },
      { label: 'Blog', href: '/blog', page: 'blog' },
      { label: '🍳 Receitas', href: '/receitas', page: 'receitas' },
      { label: '📚 Livros', href: '/livros', page: 'livros' },
      { label: '🛍️ Loja', href: '/loja', page: 'loja' },
      { label: 'Sobre', href: '/sobre', page: 'sobre' },
      { label: 'Contato', href: '/contato', page: 'contato' },
    ],
  },
  {
    label: 'Sua Jornada',
    items: [
      { label: '📊 Jornada', href: '/dashboard#/jornada', page: 'jornada', userOnly: true },
      { label: '🎯 Missões', href: '/dashboard#/missoes', page: 'missoes', userOnly: true },
      { label: '🎓 Trilhas', href: '/dashboard#/trilhas', page: 'trilhas', userOnly: true },
      { label: '🏆 Conquistas', href: '/dashboard#/conquistas', page: 'conquistas', userOnly: true },
    ],
  },
  {
    label: 'Personalizado',
    items: [
      { label: '🫘 Grãos', href: '/dashboard#/graos', page: 'graos', userOnly: true },
      { label: '☕ Torrefação', href: '/dashboard#/torrefacao', page: 'torrefacao', userOnly: true },
      { label: '📚 Biblioteca', href: '/dashboard#/biblioteca', page: 'biblioteca', userOnly: true },
      { label: '👤 Perfil', href: '/dashboard#/perfil', page: 'perfil', userOnly: true },
    ],
  },
]

/** Páginas que devem marcar o link do Blog como ativo (sub-rotas). */
export const blogActivePages = ['blog']

/** Rotas de sub-página que herdam o estado ativo do pai. */
export const activeMatchRules: { parent: string; prefix: string }[] = [
  { parent: '/blog', prefix: '/blog/' },
  { parent: '/receitas', prefix: '/receitas/' },
  { parent: '/livros', prefix: '/livro/' },
  { parent: '/loja', prefix: '/loja/' },
]
