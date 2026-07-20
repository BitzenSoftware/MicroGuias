import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Atividades para Imprimir — grátis | Micro Guias',
  description:
    'Fichas de atividades infantis para baixar e imprimir de graça: traçado, números, alfabeto, emoções e rotina. Desenvolvem coordenação motora e autonomia.',
}

type Ficha = {
  slug: string
  titulo: string
  descricao: string
  foco: string
  emoji: string
  // classes de cor do "topo" do card
  cor: string
}

const FICHAS: Ficha[] = [
  {
    slug: 'tudo-sobre-mim',
    titulo: 'Tudo Sobre Mim',
    descricao: 'Autorretrato, coisas favoritas, humor e um traçado para treinar a mãozinha.',
    foco: 'Identidade & escrita',
    emoji: '🙂',
    cor: 'from-indigo-500 to-indigo-600',
  },
  {
    slug: 'vamos-tracar',
    titulo: 'Vamos Traçar!',
    descricao: 'Caminhos pontilhados — ondas, montanhas, zigue-zague e laços — para cobrir com o lápis.',
    foco: 'Coordenação motora',
    emoji: '〰️',
    cor: 'from-sky-500 to-blue-600',
  },
  {
    slug: 'tracando-numeros',
    titulo: 'Traçando os Números',
    descricao: 'Cubra os números de 1 a 10 e depois escreva sozinho.',
    foco: 'Números & traçado',
    emoji: '🔢',
    cor: 'from-rose-500 to-red-500',
  },
  {
    slug: 'tracando-alfabeto',
    titulo: 'Traçando o Alfabeto',
    descricao: 'Todas as letras de A a Z para cobrir, mais um espaço para escrever o próprio nome.',
    foco: 'Letras & traçado',
    emoji: '🔤',
    cor: 'from-emerald-500 to-teal-600',
  },
  {
    slug: 'minhas-emocoes',
    titulo: 'Minhas Emoções',
    descricao: 'Reconhecer sentimentos, desenhar o rosto feliz e aprender a se acalmar.',
    foco: 'Socioemocional',
    emoji: '💛',
    cor: 'from-amber-400 to-orange-500',
  },
  {
    slug: 'minha-rotina',
    titulo: 'Minha Rotina do Dia',
    descricao: 'Marcar cada passo do dia — de manhã, de tarde e à noite — para ganhar autonomia.',
    foco: 'Autonomia',
    emoji: '⏰',
    cor: 'from-violet-500 to-purple-600',
  },
]

export default function AtividadesPage() {
  return (
    <div className="space-y-8">
      {/* Cabeçalho da seção */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-6 sm:px-10 py-8 text-white">
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm ring-1 ring-white/20">
            🖍️ Livros para Colorir & Atividades
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Atividades para imprimir,{' '}
            <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-white bg-clip-text text-transparent">
              de graça
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-lg text-indigo-100">
            Fichas prontas em A4 que desenvolvem coordenação motora, escrita e autonomia.
            Baixe o PDF ou imprima direto — sem cadastro, sem custo.
          </p>
        </div>
      </section>

      {/* Grade de fichas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FICHAS.map((f) => (
          <div
            key={f.slug}
            className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${f.cor}`}>
              <span className="text-5xl drop-shadow-sm" aria-hidden>{f.emoji}</span>
              <span className="absolute top-3 right-3 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm ring-1 ring-white/25">
                {f.foco}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h2 className="text-lg font-bold text-gray-900">{f.titulo}</h2>
              <p className="mt-1.5 flex-1 text-sm text-gray-500 leading-relaxed">{f.descricao}</p>

              <div className="mt-4 flex items-center gap-2">
                <a
                  href={`/atividades/${f.slug}.pdf`}
                  download
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  ⬇️ Baixar PDF
                </a>
                <a
                  href={`/atividades/${f.slug}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir para visualizar ou imprimir"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  👁️ Ver
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rodapé da seção */}
      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-6 py-6 text-center">
        <p className="text-gray-700">
          <span className="font-semibold text-indigo-700">Novas fichas toda semana.</span>{' '}
          Imprima em casa ou na escola — uso pessoal e pedagógico liberado.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          ← Voltar para a loja
        </Link>
      </section>
    </div>
  )
}
