import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { PromocaoForm, type EbookOpcao } from '@/components/admin/PromocaoForm'

export default async function EditarPromocaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: promo }, { data: ebooksData }, { data: itens }] = await Promise.all([
    supabase.from('loja_promocoes').select('id, nome, descricao, preco_centavos, ativo').eq('id', id).single(),
    supabase.from('loja_ebooks').select('id, titulo, capa_url, preco_centavos, pdf_url').order('titulo'),
    supabase.from('loja_promocao_itens').select('ebook_id').eq('promocao_id', id),
  ])

  if (!promo) return notFound()

  const ebooks: EbookOpcao[] = (ebooksData ?? []).map((e) => ({
    id: e.id, titulo: e.titulo, capa_url: e.capa_url, preco_centavos: e.preco_centavos, temPdf: !!e.pdf_url,
  }))
  const ebookIds = (itens ?? []).map((i) => i.ebook_id as string)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Editar promoção</h1>
      <PromocaoForm ebooks={ebooks} promocao={{ ...promo, ebookIds }} />
    </div>
  )
}
