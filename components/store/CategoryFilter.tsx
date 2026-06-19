import Link from 'next/link'
import type { Categoria } from '@/lib/types'

interface Props {
  categorias: Categoria[]
  categoriaAtiva?: string
}

export function CategoryFilter({ categorias, categoriaAtiva }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Link
        href="/"
        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
          !categoriaAtiva
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
        }`}
      >
        📚 Todos
      </Link>

      {categorias.map((cat) => (
        <Link
          key={cat.id}
          href={`/categoria/${cat.slug}`}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            categoriaAtiva === cat.slug
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
          }`}
        >
          {cat.icone_emoji} {cat.nome}
        </Link>
      ))}
    </div>
  )
}
