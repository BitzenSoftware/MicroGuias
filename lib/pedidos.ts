import type { SupabaseClient } from '@supabase/supabase-js'

const HORAS_VALIDADE_DOWNLOAD = 72

/**
 * Marca o pedido como pago e gera os tokens de download (1 por item).
 * Idempotente: só gera tokens se o pedido transitou de não-pago para pago.
 */
export async function confirmarPagamento(
  supabase: SupabaseClient,
  pedidoId: string
): Promise<boolean> {
  // Transição atômica: só atualiza se ainda não estava pago
  const { data: atualizados } = await supabase
    .from('loja_pedidos')
    .update({ status: 'pago', pago_em: new Date().toISOString() })
    .eq('id', pedidoId)
    .neq('status', 'pago')
    .select('id')

  // Já estava pago (ou não existe) → nada a fazer
  if (!atualizados || atualizados.length === 0) return false

  // Gera tokens de download para cada item
  const { data: itens } = await supabase
    .from('loja_pedido_itens')
    .select('id')
    .eq('pedido_id', pedidoId)

  if (itens && itens.length > 0) {
    const expira = new Date(Date.now() + HORAS_VALIDADE_DOWNLOAD * 3600 * 1000).toISOString()
    const downloads = itens.map((it) => ({
      pedido_item_id: it.id,
      expira_em: expira,
    }))
    await supabase.from('loja_downloads').insert(downloads)
  }

  return true
}
