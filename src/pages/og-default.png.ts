import type { APIRoute } from 'astro'
import { generateOgImage } from '../lib/og'

export const GET: APIRoute = async () => {
  try {
    const pngBuffer = await generateOgImage({
      title: 'Artigo com Café — Blog de Cafeteria Digital',
      category: 'Blog',
    })

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Default OG Image generation error:', error)
    return new Response('Failed to generate OG image', { status: 500 })
  }
}
