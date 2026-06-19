import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { gerarConteudoEbook } from '@/lib/gemini'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { titulo?: string; prompt?: string; nCapitulos?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { titulo, prompt, nCapitulos } = body
  if (!titulo?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: 'Título e instruções são obrigatórios' }, { status: 400 })
  }

  try {
    const conteudo = await gerarConteudoEbook(titulo, prompt, nCapitulos ?? 8)
    return NextResponse.json({ conteudo })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao gerar conteúdo'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
