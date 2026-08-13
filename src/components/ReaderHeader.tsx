// Cabeçalho padrão da área do leitor — mesmo design language do hero das
// Receitas: label + título gradiente + subtítulo, com reveal no scroll.
export default function ReaderHeader({ label, title, subtitle, children }: {
  label?: string
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <header class="reader-hero" data-reveal>
      {label && <span class="section-label">{label}</span>}
      <h1 class="section-title reader-title">{title}</h1>
      {subtitle && <p class="section-subtitle reader-subtitle">{subtitle}</p>}
      {children}
    </header>
  )
}
