// app/manifest.js — nodig om de site als PWA op het beginscherm te zetten
// (vereist voor web-push meldingen op iPhone/iPad).
export default function manifest() {
  return {
    name: 'Summer Gotcha 2026',
    short_name: 'Gotcha',
    description: 'Opvolgingssysteem — Summer Gotcha 2026',
    start_url: '/mijn-doelwit',
    display: 'standalone',
    background_color: '#0a1628',
    theme_color: '#0D3B6E',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
