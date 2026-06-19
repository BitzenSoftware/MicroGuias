import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdmin } from '@/lib/admin'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Dupla proteção (além do middleware): garante role admin.
  const admin = await getAdmin()
  if (!admin) redirect('/')

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="md:w-56 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Painel Admin
          </span>
          <Link href="/" className="text-xs text-indigo-600 hover:underline">
            Ver loja →
          </Link>
        </div>
        <AdminNav />
        <p className="mt-6 text-xs text-gray-400 px-3 truncate">{admin.email}</p>
      </aside>

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
