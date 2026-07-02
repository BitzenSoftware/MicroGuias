import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// URL assinada para enviar/trocar a CAPA de um bônus já existente.
export async function POST(request: Request) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { ebookId?: string; capaExt?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (!body.ebookId) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })

  const ext = (body.capaExt || 'jpg').toLowerCase()
  const path = `bonus/${body.ebookId}/capa-${Date.now().toString(36)}.${ext}`

  const supabase = createServiceClient()
  const { data, error } = await supabase.storage
    .from('capas')
    .createSignedUploadUrl(path, { upsert: true })
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Falha ao preparar upload' }, { status: 500 })
  }

  const capaUrl = supabase.storage.from('capas').getPublicUrl(path).data.publicUrl
  return NextResponse.json({ path: data.path, token: data.token, capaUrl })
}
