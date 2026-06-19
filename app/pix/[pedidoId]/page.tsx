import { notFound, redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PixDisplay } from '@/components/checkout/PixDisplay'

export default async function PixPage({
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
    .select('id, user_id, status, total_centavos, pix_qr_code, pix_copia_cola')
    .eq('id', pedidoId)
    .single()

  if (!pedido || pedido.user_id !== user.id) return notFound()

  return (
    <PixDisplay
      pedidoId={pedido.id}
      statusInicial={pedido.status}
      totalCentavos={pedido.total_centavos}
      qrCodeBase64={pedido.pix_qr_code}
      copiaCola={pedido.pix_copia_cola}
    />
  )
}
