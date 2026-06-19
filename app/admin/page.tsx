import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPreco } from '@/lib/utils'

export default async function AdminDashboard() {
  // service-role: contagens incluem rascunhos e dados de pedidos
  const supabase = createServiceClient()

  const [{ count: totalEbooks }, { count: publicados }, { data: pedidosPagos }] =
    await Promise.all([
      supabase.from('loja_ebooks').select('*', { count: 'exact', head: true }),
      supabase.from('loja_ebooks').select('*', { count: 'exact', head: true }).eq('publicado', true),
      supabase.from('loja_pedidos').select('total_centavos').eq('status', 'pago'),
    ])

  const receita = (pedidosPagos ?? []).reduce((s, p) => s + p.total_centavos, 0)
  const vendas = pedidosPagos?.length ?? 0

  const cards = [
    { label: 'Ebooks no catálogo', valor: totalEbooks ?? 0, icon: '📚' },
    { label: 'Publicados', valor: publicados ?? 0, icon: '✅' },
    { label: 'Vendas', valor: vendas, icon: '🧾' },
    { label: 'Receita', valor: formatPreco(receita), icon: '💰' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/admin/ebooks/novo"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          ✨ Criar ebook
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{c.valor}</div>
            <div className="text-sm text-gray-400 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900">Comece criando seu primeiro ebook</h2>
        <p className="text-sm text-gray-500 mt-1">
          Defina o tema e deixe a IA escrever o conteúdo. O PDF é gerado automaticamente.
        </p>
        <Link
          href="/admin/ebooks/novo"
          className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Criar com IA →
        </Link>
      </div>
    </div>
  )
}
