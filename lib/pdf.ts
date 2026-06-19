import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { EbookDocument } from '@/components/pdf/EbookDocument'
import type { EbookConteudo } from './types'

export async function renderEbookPdf(conteudo: EbookConteudo): Promise<Buffer> {
  const elemento = createElement(EbookDocument, { conteudo })
  // renderToBuffer aceita o elemento do react-pdf e devolve um Buffer Node
  return renderToBuffer(elemento as Parameters<typeof renderToBuffer>[0])
}
