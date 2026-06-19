import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buscarPagamento } from '@/lib/mercadopago'
import { confirmarPagamento } from '@/lib/pedidos'

export const runtime = 'nodejs'

// O Mercado Pago notifica via query (?type=payment&data.id=...) e/ou body.
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)

  let paymentId =
    searchParams.get('data.id') || searchParams.get('id') || null
  const tipo = searchParams.get('type') || searchParams.get('topic')

  // Tenta também pelo corpo
  if (!paymentId) {
    try {
      const body = await request.json()
      paymentId = body?.data?.id ?? body?.id ?? null
    } catch {}
  }

  // Só nos interessa notificação de pagamento
  if (tipo && tipo !== 'payment') {
    return NextResponse.json({ ok: true, ignored: tipo })
  }
  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: 'sem id' })
  }

  const pagamento = await buscarPagamento(String(paymentId))
  if (!pagamento || pagamento.status !== 'approved' || !pagamento.externalReference) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createServiceClient()
  await confirmarPagamento(supabase, pagamento.externalReference)

  return NextResponse.json({ ok: true })
}
