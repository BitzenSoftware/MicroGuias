import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { criarPreferencia } from '@/lib/mercadopago'

export const runtime = 'nodejs'
export const maxDuration = 30

const PERCENTUAL_DESCONTO = 0.1

export async function POST(request: Request) {
  // 1) Exige utilizador logado
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faça login para comprar' }, { status: 401 })
  }

  let body: { ebookIds?: string[]; promocaoId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Fonte dos itens: um COMBO (preço fixo) ou uma lista de ebooks (carrinho)
  let ebooks: { id: string; titulo: string; preco_centavos: number }[] = []
  let subtotal = 0
  let desconto = 0
  let total = 0
  let temDesconto = false
  let promocaoId: string | null = null
  let descricaoPedido: string | undefined

  if (body.promocaoId) {
    // ---- Combo: todos os ebooks do combo pelo preço promocional fixo ----
    const { data: promo } = await supabase
      .from('loja_promocoes')
      .select('id, nome, preco_centavos, ativo')
      .eq('id', body.promocaoId)
      .eq('ativo', true)
      .single()

    if (!promo) {
      return NextResponse.json({ error: 'Promoção indisponível' }, { status: 400 })
    }

    const { data: itens } = await supabase
      .from('loja_promocao_itens')
      .select('loja_ebooks!inner(id, titulo, preco_centavos, publicado, pdf_url)')
      .eq('promocao_id', promo.id)

    const todos = (itens ?? []).map((r) => r.loja_ebooks as unknown as {
      id: string; titulo: string; preco_centavos: number; publicado: boolean; pdf_url: string | null
    })
    ebooks = todos.filter((e) => e.publicado && e.pdf_url).map((e) => ({ id: e.id, titulo: e.titulo, preco_centavos: e.preco_centavos }))

    if (ebooks.length === 0 || ebooks.length !== todos.length) {
      return NextResponse.json(
        { error: 'Este combo está temporariamente indisponível (algum ebook sem PDF).' },
        { status: 409 }
      )
    }

    subtotal = todos.reduce((s, e) => s + e.preco_centavos, 0)
    total = promo.preco_centavos
    desconto = Math.max(0, subtotal - total)
    temDesconto = desconto > 0
    promocaoId = promo.id
    descricaoPedido = promo.nome
  } else {
    // ---- Carrinho: lista de ebooks avulsos ----
    const ids = Array.from(new Set(body.ebookIds ?? []))
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 })
    }

    // Só vende o que está publicado E tem PDF entregável.
    const { data: lista, error: ebErr } = await supabase
      .from('loja_ebooks')
      .select('id, titulo, preco_centavos, publicado, pdf_url')
      .in('id', ids)
      .eq('publicado', true)
      .not('pdf_url', 'is', null)

    if (ebErr || !lista || lista.length === 0) {
      return NextResponse.json({ error: 'Ebooks indisponíveis' }, { status: 400 })
    }
    if (lista.length !== ids.length) {
      return NextResponse.json(
        { error: 'Um dos ebooks ficou indisponível. Atualize o carrinho e tente novamente.' },
        { status: 409 }
      )
    }

    ebooks = lista.map((e) => ({ id: e.id, titulo: e.titulo, preco_centavos: e.preco_centavos }))
    subtotal = ebooks.reduce((s, e) => s + e.preco_centavos, 0)
    temDesconto = ebooks.length >= 2
    desconto = temDesconto ? Math.round(subtotal * PERCENTUAL_DESCONTO) : 0
    total = subtotal - desconto
  }

  // 4) Dados do comprador
  const { data: perfil } = await supabase
    .from('loja_perfis')
    .select('nome, email')
    .eq('id', user.id)
    .single()

  const nome = perfil?.nome || user.user_metadata?.full_name || 'Cliente'
  const email = perfil?.email || user.email || ''

  try {
    // 5) Cria o pedido
    const { data: pedido, error: pedErr } = await supabase
      .from('loja_pedidos')
      .insert({
        user_id: user.id,
        comprador_nome: nome,
        comprador_email: email,
        subtotal_centavos: subtotal,
        desconto_centavos: desconto,
        total_centavos: total,
        tem_desconto: temDesconto,
        promocao_id: promocaoId,
        status: 'aguardando',
      })
      .select('id')
      .single()

    if (pedErr || !pedido) throw new Error('Falha ao criar pedido')

    // 6) Itens do pedido
    const itens = ebooks.map((e) => ({
      pedido_id: pedido.id,
      ebook_id: e.id,
      preco_centavos: e.preco_centavos,
    }))
    const { error: itErr } = await supabase.from('loja_pedido_itens').insert(itens)
    if (itErr) throw new Error('Falha ao registrar itens')

    // 7) Cria a preferência de pagamento no Mercado Pago
    const origin = new URL(request.url).origin
    const pref = await criarPreferencia({
      pedidoId: pedido.id,
      // Combo: descrição é o nome do combo. Avulso: lista os ebooks.
      itens: descricaoPedido
        ? [{ titulo: descricaoPedido, precoCentavos: total }]
        : ebooks.map((e) => ({ titulo: e.titulo, precoCentavos: e.preco_centavos })),
      totalCentavos: total,
      pagador: { nome, email },
      origin,
    })

    // 8) Guarda a referência da preferência
    await supabase
      .from('loja_pedidos')
      .update({ abacatepay_id: pref.id })
      .eq('id', pedido.id)

    return NextResponse.json({ initPoint: pref.initPoint, pedidoId: pedido.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro no checkout'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
