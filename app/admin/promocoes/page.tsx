import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPreco } from '@/lib/utils'
import { PromocaoAcoes } from '@/components/admin/PromocaoAcoes'

export default async function AdminPromocoesPage() {
  const supabase = createServiceClient()
  const { data: promocoes } = await supabase
    .from('loja_promocoes')
    .select('id, nome, preco_centavos, ativo, loja_promocao_itens(id)')
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promoções / Combos</h1>
          <p className="text-sm text-gray-400">Venda vários ebooks por um preço promocional fixo.</p>
        </div>
        <Link href="/admin/promocoes/nova"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
          ✨ Nova promoção
        </Link>
      </div>

      {promocoes && promocoes.length > 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
          {promocoes.map((p) => {
            const qtd = (p.loja_promocao_itens as { id: string }[] | null)?.length ?? 0
            return (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/promocoes/${p.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                    {p.nome}
                  </Link>
                  <p className="text-sm text-gray-400">
                    {qtd} ebook{qtd !== 1 ? 's' : ''} · {formatPreco(p.preco_centavos)}
                  </p>
                </div>
                <PromocaoAcoes id={p.id} nome={p.nome} ativo={p.ativo} />
                <Link href={`/admin/promocoes/${p.id}`}
                  className="text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                  Editar
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="text-gray-500">Nenhuma promoção criada ainda.</p>
          <Link href="/admin/promocoes/nova" className="inline-block mt-4 text-indigo-600 font-medium hover:underline">
            Criar a primeira →
          </Link>
        </div>
      )}
    </div>
  )
}
