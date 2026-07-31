import { Resvg } from '@resvg/resvg-js'

export interface OgImageOptions {
  title: string
  category?: string
  readingTime?: number
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.substring(0, max - 1).trimEnd() + '…'
}

function createSvgTemplate(options: OgImageOptions): string {
  const { category, readingTime } = options
  const title = truncate(escapeXml(options.title), 80)

  const categoryBadge = category
    ? `<div style="display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;background:rgba(212,163,115,0.12);border:1px solid rgba(212,163,115,0.25);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;font-size:15px;font-weight:600;color:#d4a373;">${escapeXml(category)}</div>`
    : ''

  const readingTimeBadge = readingTime
    ? `<div style="display:flex;align-items:center;gap:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;font-size:15px;color:#7d7163;">📖 ${readingTime} min de leitura</div>`
    : ''

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16110c"/>
      <stop offset="50%" stop-color="#201811"/>
      <stop offset="100%" stop-color="#2a1f14"/>
    </linearGradient>
    <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d4a373"/>
      <stop offset="100%" stop-color="#8b5a2b"/>
    </linearGradient>
    <linearGradient id="sphere1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(212,163,115,0.12)"/>
      <stop offset="100%" stop-color="rgba(212,163,115,0)"/>
    </linearGradient>
    <linearGradient id="sphere2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(139,90,43,0.1)"/>
      <stop offset="100%" stop-color="rgba(139,90,43,0)"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <!-- Decorative spheres -->
  <circle cx="1050" cy="-80" r="350" fill="url(#sphere1)"/>
  <circle cx="-50" cy="550" r="300" fill="url(#sphere2)"/>

  <!-- Top: Logo + Category -->
  <foreignObject x="80" y="60" width="1040" height="50">
    <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;justify-content:space-between;align-items:center;width:100%;height:100%;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:30px;">☕</span>
        <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;font-size:22px;font-weight:800;color:#ece5db;letter-spacing:-0.02em;">Artigo com Café</span>
      </div>
      ${categoryBadge}
    </div>
  </foreignObject>

  <!-- Title -->
  <foreignObject x="80" y="140" width="1040" height="300">
    <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;flex-direction:column;justify-content:center;height:100%;">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;font-size:52px;font-weight:800;color:#ffffff;line-height:1.2;letter-spacing:-0.02em;word-wrap:break-word;">
        ${title}
      </div>
    </div>
  </foreignObject>

  <!-- Accent line (SVG native, not CSS) -->
  <rect x="80" y="448" width="80" height="4" rx="2" fill="url(#accentLine)"/>

  <!-- Bottom: Author + Reading time -->
  <foreignObject x="80" y="490" width="1040" height="60">
    <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;justify-content:space-between;align-items:center;width:100%;height:100%;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:16px;">&#9749;</span>
        <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;font-size:15px;font-weight:500;color:#a89c8c;">Artigo com Café</span>
      </div>
      ${readingTimeBadge}
    </div>
  </foreignObject>
</svg>`
}

export async function generateOgImage(options: OgImageOptions): Promise<Buffer> {
  const svg = createSvgTemplate(options)
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    background: '#16110c',
    font: {
      loadSystemFonts: true,
    },
  })
  const pngData = resvg.render()
  return Buffer.from(pngData.asPng())
}
