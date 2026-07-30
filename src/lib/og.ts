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
    ? `<div style="display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:100px;background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.2);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;font-size:15px;font-weight:600;color:#00d4aa;">${escapeXml(category)}</div>`
    : ''

  const readingTimeBadge = readingTime
    ? `<div style="display:flex;align-items:center;gap:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;font-size:15px;color:#71717a;">📖 ${readingTime} min de leitura</div>`
    : ''

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="50%" stop-color="#12121a"/>
      <stop offset="100%" stop-color="#1a1a2e"/>
    </linearGradient>
    <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00d4aa"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
    <linearGradient id="sphere1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(0,212,170,0.12)"/>
      <stop offset="100%" stop-color="rgba(0,212,170,0)"/>
    </linearGradient>
    <linearGradient id="sphere2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(124,58,237,0.1)"/>
      <stop offset="100%" stop-color="rgba(124,58,237,0)"/>
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
        <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;font-size:22px;font-weight:800;color:#e4e4e7;letter-spacing:-0.02em;">Artigo com Café</span>
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
        <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#00d4aa,#7c3aed);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;font-size:16px;font-weight:700;color:#0a0a0f;">W</div>
        <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,system-ui,sans-serif;font-size:15px;font-weight:500;color:#a1a1aa;">Wesley Alves</span>
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
    background: '#0a0a0f',
    font: {
      loadSystemFonts: true,
    },
  })
  const pngData = resvg.render()
  return Buffer.from(pngData.asPng())
}
