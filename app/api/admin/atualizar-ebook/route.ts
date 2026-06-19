import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const admin = await getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const form = await request.formData()
  const id = String(form.get('id') ?? '')
  const titulo = String(form.get('titulo') ?? '').trim()
  const categoriaId = String(form.get('categoria_id') ?? '')
  const precoCentavos = Number(form.get('preco_centavos'))
  const descricaoCurta = String(form.get('descricao_curta') ?? '')
  const descricaoLonga = String(form.get('descricao_longa') ?? '')
  const capa = form.get('capa') as File | null
  const pdf = form.get('pdf') as File | null

  if (!id || !titulo || !categoriaId || !precoCentavos) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: atual, error: getErr } = await supabase
    .from('loja_ebooks')
    .select('slug, pdf_url')
    .eq('id', id)
    .single()

  if (getErr || !atual) {
    return NextResponse.json({ error: 'Ebook não encontrado' }, { status: 404 })
  }

  try {
    const update: Record<string, unknown> = {
      titulo,
      categoria_id: categoriaId,
      preco_centavos: precoCentavos,
      descricao_curta: descricaoCurta || null,
      descricao_longa: descricaoLonga || null,
    }

    // Troca de capa (opcional)
    if (capa && capa.size > 0) {
      const ext = capa.name.split('.').pop() || 'jpg'
      const caminho = `${atual.slug}.${ext}`
      const buffer = Buffer.from(await capa.arrayBuffer())
      const { error: upErr } = await supabase.storage
        .from('capas')
        .upload(caminho, buffer, { contentType: capa.type, upsert: true })
      if (upErr) throw new Error('Capa: ' + upErr.message)
      update.capa_url = supabase.storage.from('capas').getPublicUrl(caminho).data.publicUrl
    }

    // Troca do PDF (opcional)
    if (pdf && pdf.size > 0) {
      const pdfPath = atual.pdf_url || `${atual.slug}.pdf`
      const buffer = Buffer.from(await pdf.arrayBuffer())
      const { error: pdfErr } = await supabase.storage
        .from('pdfs')
        .upload(pdfPath, buffer, { contentType: 'application/pdf', upsert: true })
      if (pdfErr) throw new Error('PDF: ' + pdfErr.message)
      update.pdf_url = pdfPath
    }

    const { error: updErr } = await supabase
      .from('loja_ebooks')
      .update(update)
      .eq('id', id)

    if (updErr) throw new Error(updErr.message)

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao atualizar'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
