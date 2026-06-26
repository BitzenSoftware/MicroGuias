import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizarCapa } from '@/lib/imagem'
import { slugify } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Recebe a imagem de capa (ou um ebookId para reprocessar a existente),
 * normaliza (fundo branco + enquadrar o livro em 3:4) e sobe ao Storage.
 * Capas são pequenas (< 4,5 MB), então passam pela função sem problema.
 */
export async function POST(request: Request) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const form = await request.formData()
  const capa = form.get('capa') as File | null
  const ebookId = String(form.get('ebook_id') ?? '')
  const slugBase = String(form.get('slug') ?? '') || slugify(admin.email)

  const supabase = createServiceClient()

  // Origem da imagem: arquivo novo OU capa existente do ebook
  let entrada: Buffer
  let slug = slugBase

  if (capa && capa.size > 0) {
    entrada = Buffer.from(await capa.arrayBuffer())
  } else if (ebookId) {
    const { data: ebook } = await supabase
      .from('loja_ebooks')
      .select('slug, capa_url')
      .eq('id', ebookId)
      .single()
    if (!ebook?.capa_url) {
      return NextResponse.json({ error: 'Ebook sem capa para reprocessar' }, { status: 400 })
    }
    slug = ebook.slug
    const resp = await fetch(ebook.capa_url)
    if (!resp.ok) return NextResponse.json({ error: 'Falha ao baixar a capa atual' }, { status: 400 })
    entrada = Buffer.from(await resp.arrayBuffer())
  } else {
    return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 })
  }

  try {
    const processada = await normalizarCapa(entrada)
    const caminho = `${slug}-${Date.now().toString(36)}.jpg`

    const { error: upErr } = await supabase.storage
      .from('capas')
      .upload(caminho, processada, { contentType: 'image/jpeg', upsert: true })
    if (upErr) throw new Error(upErr.message)

    const capaUrl = supabase.storage.from('capas').getPublicUrl(caminho).data.publicUrl

    // Se foi reprocessamento de existente, já atualiza o registro
    if (ebookId && !(capa && capa.size > 0)) {
      await supabase.from('loja_ebooks').update({ capa_url: capaUrl }).eq('id', ebookId)
    }

    return NextResponse.json({ capaUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao processar a capa'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
