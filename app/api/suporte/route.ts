import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const LIMITE_TEXTO = 2000

async function getUser() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  return user
}

async function getOuCriaConversa(supabase: ReturnType<typeof createServiceClient>, userId: string) {
  const { data: existe } = await supabase
    .from('loja_conversas')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (existe) return existe.id as string

  const { data: nova } = await supabase
    .from('loja_conversas')
    .insert({ user_id: userId })
    .select('id')
    .single()
  return nova?.id as string
}

// GET: mensagens da conversa do cliente (marca respostas do admin como lidas)
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: conversa } = await supabase
    .from('loja_conversas')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conversa) return NextResponse.json({ mensagens: [] })

  const { data: mensagens } = await supabase
    .from('loja_mensagens')
    .select('id, de_admin, texto, criado_em')
    .eq('conversa_id', conversa.id)
    .order('criado_em', { ascending: true })

  // Marca como lidas as respostas do admin
  await supabase
    .from('loja_mensagens')
    .update({ lida: true })
    .eq('conversa_id', conversa.id)
    .eq('de_admin', true)
    .eq('lida', false)

  return NextResponse.json({ mensagens: mensagens ?? [] })
}

// POST: cliente envia uma mensagem
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

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
  const conversaId = await getOuCriaConversa(supabase, user.id)

  const { error } = await supabase.from('loja_mensagens').insert({
    conversa_id: conversaId,
    autor_id: user.id,
    de_admin: false,
    texto,
  })
  if (error) return NextResponse.json({ error: 'Falha ao enviar' }, { status: 500 })

  await supabase.from('loja_conversas').update({ atualizado_em: new Date().toISOString() }).eq('id', conversaId)

  return NextResponse.json({ ok: true })
}
