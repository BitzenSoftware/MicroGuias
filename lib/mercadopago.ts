// Wrapper da API Mercado Pago (Checkout Pro)
// Docs: https://www.mercadopago.com.br/developers

const BASE_URL = 'https://api.mercadopago.com'

function headers() {
  return {
    Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

export type PreferenciaItem = {
  titulo: string
  precoCentavos: number
}

export type Preferencia = {
  id: string
  initPoint: string
}

export async function criarPreferencia(params: {
  pedidoId: string
  itens: PreferenciaItem[]
  totalCentavos: number
  pagador: { nome: string; email: string }
  origin: string
}): Promise<Preferencia> {
  const { pedidoId, totalCentavos, pagador, origin } = params

  // Cobramos o total já com desconto como um único item, para garantir
  // que o valor cobrado seja exatamente o calculado no servidor.
  const descricao =
    params.itens.length === 1
      ? params.itens[0].titulo
      : `Micro Guias — ${params.itens.length} ebooks`

  const body = {
    items: [
      {
        id: pedidoId,
        title: descricao,
        quantity: 1,
        unit_price: Number((totalCentavos / 100).toFixed(2)),
        currency_id: 'BRL',
      },
    ],
    external_reference: pedidoId,
    payer: { email: pagador.email, name: pagador.nome },
    back_urls: {
      success: `${origin}/pagamento/${pedidoId}`,
      pending: `${origin}/pagamento/${pedidoId}`,
      failure: `${origin}/carrinho`,
    },
    auto_return: 'approved',
    notification_url: `${origin}/api/mercadopago/webhook`,
    statement_descriptor: 'MICROGUIAS',
  }

  const res = await fetch(`${BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.message || `Mercado Pago: erro ${res.status}`)
  }

  return { id: json.id, initPoint: json.init_point }
}

/**
 * Procura pagamentos por external_reference (id do pedido).
 * Retorna true se houver algum pagamento aprovado.
 */
export async function pedidoEstaPago(pedidoId: string): Promise<boolean> {
  const res = await fetch(
    `${BASE_URL}/v1/payments/search?external_reference=${encodeURIComponent(pedidoId)}`,
    { headers: headers() }
  )
  if (!res.ok) return false
  const json = await res.json()
  const results = (json.results ?? []) as { status: string }[]
  return results.some((p) => p.status === 'approved')
}

/**
 * Consulta um pagamento específico pelo id (usado no webhook).
 */
export async function buscarPagamento(
  paymentId: string
): Promise<{ status: string; externalReference: string | null } | null> {
  const res = await fetch(`${BASE_URL}/v1/payments/${paymentId}`, { headers: headers() })
  if (!res.ok) return null
  const json = await res.json()
  return { status: json.status, externalReference: json.external_reference ?? null }
}
