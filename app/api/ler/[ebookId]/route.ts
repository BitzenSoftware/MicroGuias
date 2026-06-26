import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Entrega uma URL assinada de LEITURA (inline) do PDF.
 * Não é download: a disposição é inline e o leitor renderiza em canvas.
 * Acesso: admin lê qualquer ebook; cliente só lê o que comprou (pedido pago).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ebookId: string }> }
) {
  const { ebookId } = await params

  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // É admin?
  const { data: perfil } = await supabase
    .from('loja_perfis')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = perfil?.role === 'admin'

  // Busca o ebook (pdf_url = caminho no bucket privado)
  const { data: ebook } = await supabase
    .from('loja_ebooks')
    .select('id, titulo, pdf_url')
    .eq('id', ebookId)
    .single()

  if (!ebook || !ebook.pdf_url) {
    return NextResponse.json({ error: 'Ebook indisponível' }, { status: 404 })
  }

  // Se não for admin, precisa ter comprado (pedido pago com este ebook)
  if (!isAdmin) {
    const { data: comprado } = await supabase
      .from('loja_pedido_itens')
      .select('id, loja_pedidos!inner(user_id, status)')
      .eq('ebook_id', ebookId)
      .eq('loja_pedidos.user_id', user.id)
      .eq('loja_pedidos.status', 'pago')
      .limit(1)
      .maybeSingle()

    if (!comprado) {
      return NextResponse.json({ error: 'Você não tem acesso a este ebook' }, { status: 403 })
    }
  }

  // URL assinada inline (sem download), válida por 10 minutos
  const { data: signed, error } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(ebook.pdf_url, 600)

  if (error || !signed) {
    return NextResponse.json({ error: 'Falha ao abrir o ebook' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl })
}
