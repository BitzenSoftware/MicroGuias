import { GoogleGenAI } from '@google/genai'
import type { EbookConteudo } from './types'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const INSTRUCAO_SISTEMA = `Você é um autor profissional de ebooks em português do Brasil.
Escreva conteúdo prático, claro e acionável, com linguagem acessível.
Cada capítulo deve ter pelo menos 3 parágrafos bem desenvolvidos.
Use exemplos concretos e dicas aplicáveis. Não use markdown nem títulos dentro do conteúdo —
apenas texto corrido em parágrafos separados por uma linha em branco.`

export async function gerarConteudoEbook(
  titulo: string,
  promptUsuario: string,
  nCapitulos = 8
): Promise<EbookConteudo> {
  const prompt = `${INSTRUCAO_SISTEMA}

Crie um ebook completo com o título "${titulo}".
Instruções do autor: ${promptUsuario}

Gere exatamente ${nCapitulos} capítulos.

Responda APENAS com um JSON válido, sem cercas de código, neste formato exato:
{
  "titulo": "string",
  "subtitulo": "string curta e chamativa",
  "introducao": "2-3 parágrafos",
  "capitulos": [
    { "titulo": "string", "conteudo": "3+ parágrafos separados por \\n\\n" }
  ],
  "conclusao": "2 parágrafos de fechamento"
}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.8,
      maxOutputTokens: 8192,
    },
  })

  const texto = response.text
  if (!texto) throw new Error('Gemini não retornou conteúdo.')

  let parsed: EbookConteudo
  try {
    parsed = JSON.parse(texto)
  } catch {
    // fallback: remove cercas de código se vierem
    const limpo = texto.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    parsed = JSON.parse(limpo)
  }

  if (!parsed.capitulos || parsed.capitulos.length === 0) {
    throw new Error('Conteúdo gerado sem capítulos.')
  }

  return parsed
}
