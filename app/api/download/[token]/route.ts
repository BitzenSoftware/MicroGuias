import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login?next=/minha-conta', request.url))
  }

  const supabase = createServiceClient()

  // Resolve o token → item → ebook → pedido (para validar dono)
  const { data: download } = await supabase
    .from('loja_downloads')
    .select(`
      id, expira_em, downloads_realizados,
      loja_pedido_itens (
        loja_ebooks ( titulo, pdf_url ),
        loja_pedidos ( user_id, status )
      )
    `)
    .eq('token', token)
    .single()

  if (!download) {
    return NextResponse.json({ error: 'Download não encontrado' }, { status: 404 })
  }

  const item = download.loja_pedido_itens as unknown as {
    loja_ebooks: { titulo: string; pdf_url: string | null }
    loja_pedidos: { user_id: string; status: string }
  }

  // Validações
  if (item.loja_pedidos.user_id !== user.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  if (item.loja_pedidos.status !== 'pago') {
    return NextResponse.json({ error: 'Pagamento não confirmado' }, { status: 403 })
  }
  if (new Date(download.expira_em) < new Date()) {
    return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
  }
  if (!item.loja_ebooks.pdf_url) {
    return NextResponse.json({ error: 'Arquivo indisponível' }, { status: 404 })
  }

  // Gera URL assinada temporária para o PDF privado
  const nomeArquivo = `${item.loja_ebooks.titulo}.pdf`.replace(/[^\w\s.-]/g, '')
  const { data: signed, error } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(item.loja_ebooks.pdf_url, 120, { download: nomeArquivo })

  if (error || !signed) {
    return NextResponse.json({ error: 'Falha ao gerar link' }, { status: 500 })
  }

  // Registra o acesso
  await supabase
    .from('loja_downloads')
    .update({
      downloads_realizados: download.downloads_realizados + 1,
      baixado_em: new Date().toISOString(),
    })
    .eq('id', download.id)

  return NextResponse.redirect(signed.signedUrl)
}
