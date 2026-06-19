export type Categoria = {
  id: string
  nome: string
  slug: string
  icone_emoji: string
  ordem: number
}

export type Ebook = {
  id: string
  titulo: string
  slug: string
  descricao_curta: string | null
  descricao_longa: string | null
  preco_centavos: number
  capa_url: string | null
  pdf_url: string | null
  publicado: boolean
  criado_em: string
  categoria_id: string | null
  loja_categorias: Categoria | null
}
