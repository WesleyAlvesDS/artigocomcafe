import type { APIRoute } from 'astro'
import { generateOgImage } from '../../lib/og'

export const GET: APIRoute = async () => {
  try {
    const pngBuffer = await generateOgImage({
      title: 'Café da Manhã com Café: Ideias e Receitas',
      category: 'Café da Manhã',
    })

    return new Response(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Café da Manhã OG Image generation error:', error)
    return new Response('Failed to generate OG image', { status: 500 })
  }
}
