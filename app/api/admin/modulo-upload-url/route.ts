import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

export const runtime = 'nodejs'

// URL assinada para enviar o PDF de um módulo do curso direto ao Storage.
export async function POST(request: Request) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { ebookId?: string; nomeArquivo?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (!body.ebookId || !body.nomeArquivo) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const base = slugify(body.nomeArquivo.replace(/\.[^.]+$/, '')) || 'modulo'
  const path = `modulos/${body.ebookId}/${base}-${Date.now().toString(36)}.pdf`

  const supabase = createServiceClient()
  const { data, error } = await supabase.storage.from('pdfs').createSignedUploadUrl(path)
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Falha ao preparar upload' }, { status: 500 })
  }

  return NextResponse.json({ path: data.path, token: data.token })
}
