import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: {
    default: 'Micro Guias',
    template: '%s | Micro Guias',
  },
  description: 'Micro guias práticos e acessíveis para transformar sua vida',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body className="bg-gray-50 min-h-screen antialiased font-[family-name:var(--font-geist)]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Micro Guias · Todos os direitos reservados
        </footer>
      </body>
    </html>
  )
}
