import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=oauth`)
  }

  // Coleta os cookies que o Supabase quer gravar durante a troca do código.
  const cookiesParaGravar: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(lista) {
          cookiesParaGravar.push(...lista)
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=oauth`)
  }

  // Decide o destino conforme a role do utilizador.
  let destino = '/'
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: perfil } = await supabase
      .from('loja_perfis')
      .select('role')
      .eq('id', user.id)
      .single()

    if (perfil?.role === 'admin') destino = '/admin'
  }

  // Grava os cookies de sessão DIRETAMENTE na resposta de redirect.
  // (Esse é o passo que faltava — sem isto o servidor nunca vê a sessão.)
  const response = NextResponse.redirect(`${origin}${destino}`)
  cookiesParaGravar.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  )

  return response
}
