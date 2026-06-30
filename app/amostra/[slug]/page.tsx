import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AmostraReader } from '@/components/biblioteca/AmostraReader'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('loja_ebooks')
    .select('titulo')
    .eq('slug', slug)
    .single()
  return { title: data ? `Amostra · ${data.titulo}` : 'Amostra' }
}

export default async function AmostraPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Captura de e-mail: precisa estar cadastrado/logado para ler a amostra
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/cadastro?next=/amostra/${slug}`)

  const { data: ebook } = await supabase
    .from('loja_ebooks')
    .select('id, titulo, slug, preco_centavos, capa_url, pdf_url')
    .eq('slug', slug)
    .eq('publicado', true)
    .single()

  if (!ebook || !ebook.pdf_url) return notFound()

  const item = {
    id: ebook.id,
    titulo: ebook.titulo,
    slug: ebook.slug,
    preco_centavos: ebook.preco_centavos,
    capa_url: ebook.capa_url,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ebook.titulo}</h1>
          <p className="text-sm text-gray-400">Amostra grátis · leia as primeiras páginas</p>
        </div>
        <Link
          href={`/ebook/${ebook.slug}`}
          className="text-sm font-medium text-indigo-600 hover:underline whitespace-nowrap"
        >
          ← Ver detalhes
        </Link>
      </div>

      <AmostraReader item={item} />
    </div>
  )
}
