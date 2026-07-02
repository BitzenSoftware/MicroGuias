import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Download de um bônus. Só para quem comprou o ebook (ou admin).
 * Diferente do ebook principal, o bônus é entregue como DOWNLOAD.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bonusId: string }> }
) {
  const { bonusId } = await params

  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login?next=/biblioteca', request.url))
  }

  const supabase = createServiceClient()

  const { data: bonus } = await supabase
    .from('loja_ebook_bonus')
    .select('nome, arquivo_path, ebook_id')
    .eq('id', bonusId)
    .single()

  if (!bonus) {
    return NextResponse.json({ error: 'Bônus não encontrado' }, { status: 404 })
  }

  // Admin?
  const { data: perfil } = await supabase
    .from('loja_perfis')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = perfil?.role === 'admin'

  // Se não for admin, precisa ter comprado o ebook do bônus (pedido pago)
  if (!isAdmin) {
    const { data: comprado } = await supabase
      .from('loja_pedido_itens')
      .select('id, loja_pedidos!inner(user_id, status)')
      .eq('ebook_id', bonus.ebook_id)
      .eq('loja_pedidos.user_id', user.id)
      .eq('loja_pedidos.status', 'pago')
      .limit(1)
      .maybeSingle()

    if (!comprado) {
      return NextResponse.json({ error: 'Você não tem acesso a este bônus' }, { status: 403 })
    }
  }

  // Nome amigável para o arquivo baixado
  const ext = bonus.arquivo_path.split('.').pop() || 'pdf'
  const nomeArquivo = `${bonus.nome}.${ext}`.replace(/[^\w\s.-]/g, '')

  const { data: signed, error } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(bonus.arquivo_path, 120, { download: nomeArquivo })

  if (error || !signed) {
    return NextResponse.json({ error: 'Falha ao gerar o download' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
