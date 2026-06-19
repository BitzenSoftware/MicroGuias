import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Recebe metadados + caminhos opcionais (arquivos enviados direto ao Storage).
export async function POST(request: Request) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let b: {
    id?: string
    titulo?: string
    categoria_id?: string
    preco_centavos?: number
    descricao_curta?: string
    descricao_longa?: string
    capa_url?: string | null
    pdf_path?: string | null
  }
  try {
    b = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!b.id || !b.titulo || !b.categoria_id || !b.preco_centavos) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const update: Record<string, unknown> = {
    titulo: b.titulo,
    categoria_id: b.categoria_id,
    preco_centavos: b.preco_centavos,
    descricao_curta: b.descricao_curta || null,
    descricao_longa: b.descricao_longa || null,
  }
  // Só atualiza arquivos se vieram novos caminhos
  if (b.capa_url) update.capa_url = b.capa_url
  if (b.pdf_path) update.pdf_url = b.pdf_path

  const { error } = await supabase
    .from('loja_ebooks')
    .update(update)
    .eq('id', b.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
