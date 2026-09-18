import './globals.css'
import { Inter_Tight } from 'next/font/google'

const font = Inter_Tight({ subsets: ['latin'] })

export const metadata = {
  title: 'Dues Tracker',
  description: 'Fantasy football league dues, winnings, and payments',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={font.className}>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased">{children}</body>
    </html>
  )
}
