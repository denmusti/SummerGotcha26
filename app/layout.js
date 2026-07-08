// app/layout.js
export const metadata = {
  title: 'Summer Gotcha 2026',
  description: 'Officieel opvolgingssysteem — Summer Gotcha 2026',
}

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif', background: '#0a1628' }}>
        {children}
      </body>
    </html>
  )
}
