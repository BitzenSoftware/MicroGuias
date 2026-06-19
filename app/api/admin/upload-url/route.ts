import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

export const runtime = 'nodejs'

// Gera URLs de upload assinadas para o navegador enviar os arquivos
// direto ao Supabase Storage (evita o limite de 4,5 MB da Vercel).
export async function POST(request: Request) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: {
    titulo?: string
    slug?: string
    capaExt?: string
    temCapa?: boolean
    temPdf?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const slug = body.slug || `${slugify(body.titulo ?? 'ebook')}-${Date.now().toString(36)}`
  const supabase = createServiceClient()

  const resposta: Record<string, unknown> = { slug }

  try {
    if (body.temPdf) {
      const path = `${slug}.pdf`
      const { data, error } = await supabase.storage
        .from('pdfs')
        .createSignedUploadUrl(path, { upsert: true })
      if (error || !data) throw new Error('PDF: ' + (error?.message ?? 'falha'))
      resposta.pdf = { path: data.path, token: data.token }
    }

    if (body.temCapa) {
      const ext = (body.capaExt || 'jpg').toLowerCase()
      const path = `${slug}.${ext}`
      const { data, error } = await supabase.storage
        .from('capas')
        .createSignedUploadUrl(path, { upsert: true })
      if (error || !data) throw new Error('Capa: ' + (error?.message ?? 'falha'))
      resposta.capa = { path: data.path, token: data.token }
      resposta.capaUrl = supabase.storage.from('capas').getPublicUrl(path).data.publicUrl
    }

    return NextResponse.json(resposta)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao preparar upload'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
