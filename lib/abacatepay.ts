// Wrapper da API AbacatePay (PIX QR Code)
// Docs: https://docs.abacatepay.com

const BASE_URL = 'https://api.abacatepay.com/v1'

function headers() {
  return {
    Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

export type PixCriado = {
  id: string
  brCode: string        // copia e cola
  brCodeBase64: string  // imagem QR (data URL)
  amount: number
  status: string
  expiresAt: string | null
}

type Cliente = {
  nome: string
  email: string
  cpf?: string
  celular?: string
}

export async function criarPix(
  valorCentavos: number,
  descricao: string,
  cliente: Cliente,
  expiraEmSegundos = 3600
): Promise<PixCriado> {
  const body: Record<string, unknown> = {
    amount: valorCentavos,
    expiresIn: expiraEmSegundos,
    description: descricao,
  }

  // O AbacatePay exige taxId (CPF) quando customer é enviado.
  // Só incluímos customer se tivermos CPF, evitando fricção no checkout.
  if (cliente.cpf) {
    const customer: Record<string, string> = {
      name: cliente.nome,
      email: cliente.email,
      taxId: cliente.cpf,
    }
    if (cliente.celular) customer.cellphone = cliente.celular
    body.customer = customer
  }

  const res = await fetch(`${BASE_URL}/pixQrCode/create`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok || json.error) {
    throw new Error(json.error || `AbacatePay: erro ${res.status}`)
  }

  const d = json.data
  return {
    id: d.id,
    brCode: d.brCode,
    brCodeBase64: d.brCodeBase64,
    amount: d.amount,
    status: d.status,
    expiresAt: d.expiresAt ?? null,
  }
}

export async function checarPix(id: string): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/pixQrCode/check?id=${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: headers(),
  })

  const json = await res.json()
  if (!res.ok || json.error) {
    throw new Error(json.error || `AbacatePay: erro ${res.status}`)
  }

  return { status: json.data.status }
}
