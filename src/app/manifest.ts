import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cock 'n Tail",
    short_name: "Cock 'n Tail",
    description: 'Shuffle ingredients until a cocktail idea lands.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    // A bar is a dark room, so the splash matches the dark theme rather than
    // the system preference the running app follows.
    background_color: '#0e0d0c',
    theme_color: '#0e0d0c',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
