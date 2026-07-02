import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * URL assinada de LEITURA (inline) do PDF de um módulo do curso.
 * Acesso: admin lê qualquer um; cliente só se comprou o curso (pedido pago).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ moduloId: string }> }
) {
  const { moduloId } = await params

  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: modulo } = await supabase
    .from('loja_ebook_modulos')
    .select('arquivo_path, ebook_id')
    .eq('id', moduloId)
    .single()

  if (!modulo || !modulo.arquivo_path) {
    return NextResponse.json({ error: 'Módulo indisponível' }, { status: 404 })
  }

  const { data: perfil } = await supabase
    .from('loja_perfis')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = perfil?.role === 'admin'

  if (!isAdmin) {
    const { data: comprado } = await supabase
      .from('loja_pedido_itens')
      .select('id, loja_pedidos!inner(user_id, status)')
      .eq('ebook_id', modulo.ebook_id)
      .eq('loja_pedidos.user_id', user.id)
      .eq('loja_pedidos.status', 'pago')
      .limit(1)
      .maybeSingle()

    if (!comprado) {
      return NextResponse.json({ error: 'Você não tem acesso a este curso' }, { status: 403 })
    }
  }

  const { data: signed, error } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(modulo.arquivo_path, 600)

  if (error || !signed) {
    return NextResponse.json({ error: 'Falha ao abrir o módulo' }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl })
}
