import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { StatusPoller } from '@/components/checkout/StatusPoller'

export default async function PagamentoPage({
  params,
}: {
  params: Promise<{ pedidoId: string }>
}) {
  const { pedidoId } = await params

  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const supabase = createServiceClient()
  const { data: pedido } = await supabase
    .from('loja_pedidos')
    .select('id, user_id, status')
    .eq('id', pedidoId)
    .single()

  if (!pedido || pedido.user_id !== user.id) return notFound()

  return <StatusPoller pedidoId={pedido.id} statusInicial={pedido.status} />
}
