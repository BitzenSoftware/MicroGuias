import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = request.nextUrl.pathname.startsWith('/admin')
  const isDownloads = request.nextUrl.pathname.startsWith('/downloads')
  const isBiblioteca = request.nextUrl.pathname.startsWith('/biblioteca')
  const isMinhaConta = request.nextUrl.pathname.startsWith('/minha-conta')
  const isSuporte = request.nextUrl.pathname.startsWith('/suporte')
  const isAuth = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/cadastro'

  // Rotas protegidas: requer login
  if ((isAdmin || isDownloads || isBiblioteca || isMinhaConta || isSuporte) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // /admin: requer role admin
  if (isAdmin && user) {
    const { data: perfil } = await supabase
      .from('loja_perfis')
      .select('role')
      .eq('id', user.id)
      .single()

    if (perfil?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Login/cadastro: redireciona utilizador já logado para home
  if (isAuth && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|auth/callback|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
