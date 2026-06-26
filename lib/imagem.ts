// Largura/altura alvo da capa padronizada (proporção 3:4)
const LARGURA = 1000
const ALTURA = 1333

/**
 * Normaliza a capa: fundo branco + recorte do miolo (best-effort) + canvas 3:4.
 * O recorte (trim) é tentado isoladamente — se falhar, segue sem recortar.
 * O resize/jpeg final SEMPRE roda; se o sharp não conseguir ler a imagem,
 * o erro propaga para quem chamou decidir o fallback.
 */
export async function normalizarCapa(entrada: Buffer): Promise<Buffer> {
  // Import dinâmico: se o sharp não carregar no ambiente, o erro é capturado
  // por quem chamou, que então usa a imagem original (fallback).
  const { default: sharp } = await import('sharp')

  // 1) Recorte do excesso de fundo — opcional
  let base: Buffer = entrada
  try {
    base = await sharp(entrada)
      .flatten({ background: '#ffffff' })
      .trim({ threshold: 25 })
      .toBuffer()
  } catch {
    base = entrada
  }

  // 2) Reenquadra em 3:4 sobre branco e exporta JPEG válido
  return sharp(base)
    .flatten({ background: '#ffffff' })
    .resize(LARGURA, ALTURA, { fit: 'contain', background: '#ffffff' })
    .jpeg({ quality: 88 })
    .toBuffer()
}
