import { createServiceClient } from '@/lib/supabase/server'
import { PromocaoForm, type EbookOpcao } from '@/components/admin/PromocaoForm'

export default async function NovaPromocaoPage() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('loja_ebooks')
    .select('id, titulo, capa_url, preco_centavos, pdf_url')
    .order('titulo')

  const ebooks: EbookOpcao[] = (data ?? []).map((e) => ({
    id: e.id, titulo: e.titulo, capa_url: e.capa_url, preco_centavos: e.preco_centavos, temPdf: !!e.pdf_url,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Nova promoção</h1>
      <PromocaoForm ebooks={ebooks} />
    </div>
  )
}
