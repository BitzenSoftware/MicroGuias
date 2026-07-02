import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET: lista as conversas com dados do cliente, última mensagem e não-lidas
export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: conversas } = await supabase
    .from('loja_conversas')
    .select('id, user_id, atualizado_em')
    .order('atualizado_em', { ascending: false })

  if (!conversas || conversas.length === 0) return NextResponse.json({ conversas: [] })

  const userIds = conversas.map((c) => c.user_id)
  const convIds = conversas.map((c) => c.id)

  const [{ data: perfis }, { data: mensagens }] = await Promise.all([
    supabase.from('loja_perfis').select('id, nome, email').in('id', userIds),
    supabase.from('loja_mensagens').select('conversa_id, texto, de_admin, lida, criado_em').in('conversa_id', convIds).order('criado_em', { ascending: true }),
  ])

  const perfilPorId = new Map((perfis ?? []).map((p) => [p.id, p]))
  const ultimaPorConversa = new Map<string, { texto: string; criado_em: string }>()
  const naoLidasPorConversa = new Map<string, number>()

  for (const m of mensagens ?? []) {
    ultimaPorConversa.set(m.conversa_id, { texto: m.texto, criado_em: m.criado_em })
    if (!m.de_admin && !m.lida) {
      naoLidasPorConversa.set(m.conversa_id, (naoLidasPorConversa.get(m.conversa_id) ?? 0) + 1)
    }
  }

  const lista = conversas.map((c) => {
    const p = perfilPorId.get(c.user_id)
    return {
      id: c.id,
      nome: p?.nome || p?.email || 'Cliente',
      email: p?.email || '',
      ultima: ultimaPorConversa.get(c.id)?.texto ?? '',
      atualizado_em: c.atualizado_em,
      naoLidas: naoLidasPorConversa.get(c.id) ?? 0,
    }
  })

  return NextResponse.json({ conversas: lista })
}
