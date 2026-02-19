import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FlashCards Cloud',
    short_name: 'FlashCards',
    description: 'Application web de flashcards synchronisees.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f4f5',
    theme_color: '#0f172a',
    lang: 'fr',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '64x64',
        type: 'image/x-icon',
      },
    ],
  };
}