import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { renderEbookPdf } from '@/lib/pdf'
import { slugify } from '@/lib/utils'
import type { EbookConteudo } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const form = await request.formData()
  const titulo = String(form.get('titulo') ?? '').trim()
  const categoriaId = String(form.get('categoria_id') ?? '')
  const precoCentavos = Number(form.get('preco_centavos'))
  const descricaoCurta = String(form.get('descricao_curta') ?? '')
  const geminiPrompt = String(form.get('gemini_prompt') ?? '')
  const conteudoRaw = String(form.get('conteudo') ?? '')
  const capa = form.get('capa') as File | null

  if (!titulo || !categoriaId || !precoCentavos || !conteudoRaw) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  let conteudo: EbookConteudo
  try {
    conteudo = JSON.parse(conteudoRaw)
  } catch {
    return NextResponse.json({ error: 'Conteúdo inválido' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const slug = `${slugify(titulo)}-${Date.now().toString(36)}`

  try {
    // 1) Upload da capa (opcional)
    let capaUrl: string | null = null
    if (capa && capa.size > 0) {
      const ext = capa.name.split('.').pop() || 'jpg'
      const caminho = `${slug}.${ext}`
      const buffer = Buffer.from(await capa.arrayBuffer())
      const { error: upErr } = await supabase.storage
        .from('capas')
        .upload(caminho, buffer, { contentType: capa.type, upsert: true })
      if (upErr) throw new Error('Capa: ' + upErr.message)
      capaUrl = supabase.storage.from('capas').getPublicUrl(caminho).data.publicUrl
    }

    // 2) Gera o PDF
    const pdfBuffer = await renderEbookPdf(conteudo)
    const pdfPath = `${slug}.pdf`
    const { error: pdfErr } = await supabase.storage
      .from('pdfs')
      .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true })
    if (pdfErr) throw new Error('PDF: ' + pdfErr.message)

    // 3) Insere o ebook
    const { data: ebook, error: insErr } = await supabase
      .from('loja_ebooks')
      .insert({
        titulo,
        slug,
        descricao_curta: descricaoCurta || null,
        descricao_longa: conteudo.introducao,
        categoria_id: categoriaId,
        preco_centavos: precoCentavos,
        capa_url: capaUrl,
        pdf_url: pdfPath, // caminho no bucket privado
        gemini_prompt: geminiPrompt,
        conteudo, // guarda o JSON gerado para regenerar o PDF depois
        publicado: true,
      })
      .select('id, slug')
      .single()

    if (insErr) throw new Error(insErr.message)

    return NextResponse.json({ ok: true, ebook })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao criar ebook'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
