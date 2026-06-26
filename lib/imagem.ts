import sharp from 'sharp'

// Largura/altura alvo da capa padronizada (proporção 3:4)
const LARGURA = 1000
const ALTURA = 1333

/**
 * Normaliza a imagem de capa:
 * 1. Achata sobre fundo branco (remove transparência)
 * 2. Recorta as bordas de fundo uniforme (deixa só o livro + sombra)
 * 3. Reenquadra num canvas 3:4 branco, com o livro preenchendo o espaço
 * Se algo falhar, devolve o buffer original.
 */
export async function normalizarCapa(entrada: Buffer): Promise<Buffer> {
  try {
    return await sharp(entrada)
      .flatten({ background: '#ffffff' })
      .trim({ threshold: 25 })
      .resize(LARGURA, ALTURA, {
        fit: 'contain',
        background: '#ffffff',
        withoutEnlargement: false,
      })
      .jpeg({ quality: 88 })
      .toBuffer()
  } catch {
    return entrada
  }
}
