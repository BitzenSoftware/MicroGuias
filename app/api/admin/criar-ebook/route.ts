import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Recebe apenas metadados + caminhos (os arquivos já foram enviados
// direto ao Storage pelo navegador via URLs assinadas).
export async function POST(request: Request) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let b: {
    titulo?: string
    slug?: string
    categoria_id?: string
    preco_centavos?: number
    descricao_curta?: string
    descricao_longa?: string
    capa_url?: string | null
    pdf_path?: string
  }
  try {
    b = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!b.titulo || !b.slug || !b.categoria_id || !b.preco_centavos) {
    return NextResponse.json({ error: 'Preencha título, categoria e preço.' }, { status: 400 })
  }
  if (!b.pdf_path) {
    return NextResponse.json({ error: 'Anexe o arquivo PDF do ebook.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: ebook, error } = await supabase
    .from('loja_ebooks')
    .insert({
      titulo: b.titulo,
      slug: b.slug,
      descricao_curta: b.descricao_curta || null,
      descricao_longa: b.descricao_longa || null,
      categoria_id: b.categoria_id,
      preco_centavos: b.preco_centavos,
      capa_url: b.capa_url || null,
      pdf_url: b.pdf_path,
      publicado: true,
    })
    .select('id, slug')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, ebook })
}
