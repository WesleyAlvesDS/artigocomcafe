export interface ThemeVocabulary {
  currency: string
  currency_icon: string
  roasting: string
  roast_action: string
  collection: string
  blend: string
  machine: string
  brew: string
  harvest: string
}

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  gradient_from: string
  gradient_to: string
}

export interface ThemeDefinition {
  id: string
  name: string
  icon: string
  description: string
  colors: ThemeColors
  vocabulary: ThemeVocabulary
}

export const THEMES: Record<string, ThemeDefinition> = {
  cafe: {
    id: 'cafe',
    name: 'Café',
    icon: '☕',
    description: 'A essência do conhecimento com sabor de café',
    colors: { primary: '#d4a373', secondary: '#8b5a2b', accent: '#b07d3f', gradient_from: '#d4a373', gradient_to: '#8b5a2b' },
    vocabulary: { currency: 'Grãos', currency_icon: '🫘', roasting: 'Torrefação', roast_action: 'Torrar', collection: 'Coleção', blend: 'Blend', machine: 'Cafeteira', brew: 'Preparo', harvest: 'Colheita' },
  },
  livros: {
    id: 'livros', name: 'Livros', icon: '📚',
    description: 'Uma biblioteca de conhecimento ao seu alcance',
    colors: { primary: '#d97706', secondary: '#92400e', accent: '#fbbf24', gradient_from: '#d97706', gradient_to: '#92400e' },
    vocabulary: { currency: 'Páginas', currency_icon: '📄', roasting: 'Encadernação', roast_action: 'Encadernar', collection: 'Biblioteca', blend: 'Volume', machine: 'Estante', brew: 'Capítulo', harvest: 'Leitura' },
  },
  tecnologia: {
    id: 'tecnologia', name: 'Tecnologia', icon: '💻',
    description: 'Inovação e conhecimento tech em cada descoberta',
    colors: { primary: '#06b6d4', secondary: '#3b82f6', accent: '#f97316', gradient_from: '#06b6d4', gradient_to: '#3b82f6' },
    vocabulary: { currency: 'Bits', currency_icon: '💠', roasting: 'Compilação', roast_action: 'Compilar', collection: 'Workspace', blend: 'Stack', machine: 'Servidor', brew: 'Commit', harvest: 'Deploy' },
  },
  natureza: {
    id: 'natureza', name: 'Natureza', icon: '🌿',
    description: 'Cresça como uma floresta de conhecimento',
    colors: { primary: '#22c55e', secondary: '#15803d', accent: '#eab308', gradient_from: '#22c55e', gradient_to: '#15803d' },
    vocabulary: { currency: 'Folhas', currency_icon: '🍃', roasting: 'Florescimento', roast_action: 'Florescer', collection: 'Jardim', blend: 'Ecossistema', machine: 'Raiz', brew: 'Broto', harvest: 'Safra' },
  },
  espaco: {
    id: 'espaco', name: 'Espaço', icon: '🌌',
    description: 'Explore o universo infinito do saber',
    colors: { primary: '#a855f7', secondary: '#6b21a8', accent: '#f472b6', gradient_from: '#a855f7', gradient_to: '#6b21a8' },
    vocabulary: { currency: 'Estrelas', currency_icon: '⭐', roasting: 'Nebulosa', roast_action: 'Explorar', collection: 'Constelação', blend: 'Galáxia', machine: 'Foguete', brew: 'Órbita', harvest: 'Descoberta' },
  },
  games: {
    id: 'games', name: 'Games', icon: '🎮',
    description: 'Cada artigo é uma nova fase a ser conquistada',
    colors: { primary: '#ef4444', secondary: '#f97316', accent: '#22c55e', gradient_from: '#ef4444', gradient_to: '#f97316' },
    vocabulary: { currency: 'Moedas', currency_icon: '🪙', roasting: 'Upgrade', roast_action: 'Evoluir', collection: 'Inventário', blend: 'Loadout', machine: 'Console', brew: 'Missão', harvest: 'Conquista' },
  },
  musica: {
    id: 'musica', name: 'Música', icon: '🎵',
    description: 'A sinfonia do conhecimento em cada nota',
    colors: { primary: '#ec4899', secondary: '#be185d', accent: '#8b5cf6', gradient_from: '#ec4899', gradient_to: '#be185d' },
    vocabulary: { currency: 'Notas', currency_icon: '🎵', roasting: 'Composição', roast_action: 'Compor', collection: 'Playlist', blend: 'Acorde', machine: 'Instrumento', brew: 'Melodia', harvest: 'Apresentação' },
  },
}

/** Get theme definition by ID, defaults to cafe */
export function getTheme(id?: string): ThemeDefinition {
  return THEMES[id || 'cafe'] || THEMES.cafe
}

/** Apply theme colors to CSS custom properties on document root */
export function applyThemeColors(themeId: string, isDark: boolean = true) {
  const theme = getTheme(themeId)
  const root = document.documentElement
  const { colors } = theme

  root.style.setProperty('--color-accent', colors.primary)
  root.style.setProperty('--color-accent-dark', colors.primary)
  root.style.setProperty('--color-accent-secondary', colors.secondary)
  root.style.setProperty('--color-accent-secondary-dark', colors.secondary)

  // Update gradient text
  root.style.setProperty('--gradient-from', colors.gradient_from)
  root.style.setProperty('--gradient-to', colors.gradient_to)

  // Update shadow glow
  root.style.setProperty('--shadow-glow', `0 0 40px ${colors.primary}15`)

  // Store in localStorage
  localStorage.setItem('user_theme', themeId)
}

/** Reset theme to default cafe theme */
export function resetThemeColors() {
  applyThemeColors('cafe')
  localStorage.removeItem('user_theme')
}

/** Get the current user theme ID from localStorage */
export function getStoredTheme(): string {
  if (typeof window === 'undefined') return 'cafe'
  return localStorage.getItem('user_theme') || 'cafe'
}

/** Get theme vocabulary for the current stored theme */
export function getCurrentVocabulary(): ThemeVocabulary {
  return getTheme(getStoredTheme()).vocabulary
}

