'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/ebooks', label: 'Ebooks', icon: '📚' },
  { href: '/admin/ebooks/novo', label: 'Novo ebook', icon: '✨' },
  { href: '/admin/categorias', label: 'Categorias', icon: '🏷️' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '🧾' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const ativo =
          link.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              ativo
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
