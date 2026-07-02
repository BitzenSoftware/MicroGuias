import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

export const runtime = 'nodejs'

// URL assinada para o navegador enviar um arquivo de bônus direto ao Storage.
export async function POST(request: Request) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { ebookId?: string; nomeArquivo?: string; temCapa?: boolean; capaExt?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.ebookId || !body.nomeArquivo) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const ts = Date.now().toString(36)
  const base = slugify(body.nomeArquivo.replace(/\.[^.]+$/, '')) || 'bonus'

  try {
    // Arquivo do bônus → bucket privado 'pdfs'
    const ext = (body.nomeArquivo.split('.').pop() || 'pdf').toLowerCase()
    const path = `bonus/${body.ebookId}/${base}-${ts}.${ext}`
    const { data, error } = await supabase.storage.from('pdfs').createSignedUploadUrl(path)
    if (error || !data) throw new Error(error?.message ?? 'Falha ao preparar upload')

    const resposta: Record<string, unknown> = { path: data.path, token: data.token }

    // Capa do bônus (opcional) → bucket público 'capas'
    if (body.temCapa) {
      const capaExt = (body.capaExt || 'jpg').toLowerCase()
      const capaPath = `bonus/${body.ebookId}/${base}-${ts}.${capaExt}`
      const { data: capaData, error: capaErr } = await supabase.storage
        .from('capas')
        .createSignedUploadUrl(capaPath, { upsert: true })
      if (capaErr || !capaData) throw new Error(capaErr?.message ?? 'Falha na capa')
      resposta.capa = { path: capaData.path, token: capaData.token }
      resposta.capaUrl = supabase.storage.from('capas').getPublicUrl(capaPath).data.publicUrl
    }

    return NextResponse.json(resposta)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao preparar upload'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
