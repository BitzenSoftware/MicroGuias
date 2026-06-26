import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizarCapa } from '@/lib/imagem'
import { slugify } from '@/lib/utils'

export const runtime = 'nodejs'
export const maxDuration = 30

function extDoMime(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  return 'jpg'
}

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

  // Origem: arquivo novo OU capa existente do ebook
  let entrada: Buffer
  let mimeOriginal = 'image/png'
  let slug = slugBase

  if (capa && capa.size > 0) {
    entrada = Buffer.from(await capa.arrayBuffer())
    mimeOriginal = capa.type || 'image/png'
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
    mimeOriginal = resp.headers.get('content-type') || 'image/jpeg'
  } else {
    return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 })
  }

  // Tenta normalizar; se o sharp falhar, usa a imagem original (válida)
  let buffer: Buffer
  let contentType: string
  let ext: string
  try {
    buffer = await normalizarCapa(entrada)
    contentType = 'image/jpeg'
    ext = 'jpg'
  } catch {
    buffer = entrada
    contentType = mimeOriginal
    ext = extDoMime(mimeOriginal)
  }

  try {
    const caminho = `${slug}-${Date.now().toString(36)}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('capas')
      .upload(caminho, buffer, { contentType, upsert: true })
    if (upErr) throw new Error(upErr.message)

    const capaUrl = supabase.storage.from('capas').getPublicUrl(caminho).data.publicUrl

    // Reprocessamento de existente → já atualiza o registro
    if (ebookId && !(capa && capa.size > 0)) {
      await supabase.from('loja_ebooks').update({ capa_url: capaUrl }).eq('id', ebookId)
    }

    return NextResponse.json({ capaUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao salvar a capa'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
