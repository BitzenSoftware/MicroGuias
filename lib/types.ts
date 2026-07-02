export type Categoria = {
  id: string
  nome: string
  slug: string
  icone_emoji: string
  ordem: number
  ativa?: boolean
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
  conteudo?: EbookConteudo | null
  loja_categorias: Categoria | null
}

export type EbookBonus = {
  id: string
  ebook_id: string
  nome: string
  arquivo_path: string
  criado_em: string
}

export type Promocao = {
  id: string
  nome: string
  slug: string
  descricao: string | null
  preco_centavos: number
  capa_url: string | null
  ativo: boolean
  criado_em: string
}

// Conteúdo estruturado gerado pelo Gemini
export type Capitulo = {
  titulo: string
  conteudo: string
}

export type EbookConteudo = {
  titulo: string
  subtitulo: string
  introducao: string
  capitulos: Capitulo[]
  conclusao: string
}
