import type { SupabaseClient } from '@supabase/supabase-js'

export type PromoEbook = {
  id: string
  titulo: string
  slug: string
  capa_url: string | null
  preco_centavos: number
}

export type PromoComItens = {
  id: string
  nome: string
  slug: string
  descricao: string | null
  preco_centavos: number
  ebooks: PromoEbook[]
  subtotal: number
  economia: number
  disponivel: boolean
}

const SELECT = `
  id, nome, slug, descricao, preco_centavos,
  loja_promocao_itens ( ebook_id, loja_ebooks ( id, titulo, slug, capa_url, preco_centavos, publicado, pdf_url ) )
`

type Row = {
  id: string
  nome: string
  slug: string
  descricao: string | null
  preco_centavos: number
  loja_promocao_itens: {
    ebook_id: string
    loja_ebooks: {
      id: string; titulo: string; slug: string; capa_url: string | null
      preco_centavos: number; publicado: boolean; pdf_url: string | null
    } | null
  }[] | null
}

function montar(row: Row): PromoComItens {
  const itens = row.loja_promocao_itens ?? []
  const ebooks: PromoEbook[] = []
  let subtotal = 0
  let todosVendaveis = itens.length > 0

  for (const it of itens) {
    const e = it.loja_ebooks
    // ebook oculto pela RLS (não publicado) vem null → combo incompleto
    if (!e || !e.publicado || !e.pdf_url) {
      todosVendaveis = false
      if (e) { subtotal += e.preco_centavos } // ainda soma para mostrar o valor cheio
      continue
    }
    subtotal += e.preco_centavos
    ebooks.push({ id: e.id, titulo: e.titulo, slug: e.slug, capa_url: e.capa_url, preco_centavos: e.preco_centavos })
  }

  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    descricao: row.descricao,
    preco_centavos: row.preco_centavos,
    ebooks,
    subtotal,
    economia: Math.max(0, subtotal - row.preco_centavos),
    disponivel: todosVendaveis && ebooks.length > 0,
  }
}

export async function listarPromocoesAtivas(supabase: SupabaseClient): Promise<PromoComItens[]> {
  const { data } = await supabase
    .from('loja_promocoes')
    .select(SELECT)
    .eq('ativo', true)
    .order('criado_em', { ascending: false })

  return ((data as unknown as Row[] | null) ?? []).map(montar).filter((p) => p.disponivel)
}

export async function carregarPromocao(
  supabase: SupabaseClient,
  slug: string
): Promise<PromoComItens | null> {
  const { data } = await supabase
    .from('loja_promocoes')
    .select(SELECT)
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  return data ? montar(data as unknown as Row) : null
}
