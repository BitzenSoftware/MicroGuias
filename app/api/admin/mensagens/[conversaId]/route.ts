import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const LIMITE_TEXTO = 2000

// GET: mensagens de uma conversa (marca as do cliente como lidas)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversaId: string }> }
) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { conversaId } = await params
  const supabase = createServiceClient()

  const { data: mensagens } = await supabase
    .from('loja_mensagens')
    .select('id, de_admin, texto, criado_em')
    .eq('conversa_id', conversaId)
    .order('criado_em', { ascending: true })

  await supabase
    .from('loja_mensagens')
    .update({ lida: true })
    .eq('conversa_id', conversaId)
    .eq('de_admin', false)
    .eq('lida', false)

  return NextResponse.json({ mensagens: mensagens ?? [] })
}

// POST: admin responde
export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversaId: string }> }
) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { conversaId } = await params

  let body: { texto?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const texto = (body.texto ?? '').trim()
  if (!texto) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
  if (texto.length > LIMITE_TEXTO) return NextResponse.json({ error: 'Mensagem muito longa' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from('loja_mensagens').insert({
    conversa_id: conversaId,
    autor_id: admin.id,
    de_admin: true,
    texto,
  })
  if (error) return NextResponse.json({ error: 'Falha ao enviar' }, { status: 500 })

  await supabase.from('loja_conversas').update({ atualizado_em: new Date().toISOString() }).eq('id', conversaId)

  return NextResponse.json({ ok: true })
}
