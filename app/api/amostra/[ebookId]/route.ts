import { NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Quantas páginas a amostra libera
const PAGINAS_AMOSTRA = 3

/**
 * Amostra grátis: devolve um PDF com APENAS as primeiras páginas.
 * Exige login (captura de e-mail). O ebook completo nunca sai do servidor.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ebookId: string }> }
) {
  const { ebookId } = await params

  // Precisa estar logado (já capturamos o e-mail no cadastro)
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Cadastre-se para ler a amostra' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Só ebooks publicados (não vaza rascunho)
  const { data: ebook } = await supabase
    .from('loja_ebooks')
    .select('id, pdf_url, publicado')
    .eq('id', ebookId)
    .eq('publicado', true)
    .single()

  if (!ebook || !ebook.pdf_url) {
    return NextResponse.json({ error: 'Amostra indisponível' }, { status: 404 })
  }

  // Baixa o PDF completo no servidor (não é exposto ao cliente)
  const { data: blob, error } = await supabase.storage.from('pdfs').download(ebook.pdf_url)
  if (error || !blob) {
    return NextResponse.json({ error: 'Falha ao abrir a amostra' }, { status: 500 })
  }

  try {
    const bytes = new Uint8Array(await blob.arrayBuffer())
    const original = await PDFDocument.load(bytes)
    const total = original.getPageCount()
    const nAmostra = Math.min(total, PAGINAS_AMOSTRA)

    const amostra = await PDFDocument.create()
    const indices = Array.from({ length: nAmostra }, (_, i) => i)
    const paginas = await amostra.copyPages(original, indices)
    paginas.forEach((p) => amostra.addPage(p))

    const out = await amostra.save()
    const buffer = new Uint8Array(out)

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=3600',
        'X-Total-Pages': String(total),
        'X-Sample-Pages': String(nAmostra),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Falha ao gerar a amostra' }, { status: 500 })
  }
}
