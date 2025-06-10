import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  console.log(`[MIDDLEWARE] Processing: ${pathname}`)

  // Rutas que no requieren middleware
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/setup" ||
    pathname === "/test-connection" ||
    pathname === "/debug"
  ) {
    console.log(`[MIDDLEWARE] Skipping middleware for: ${pathname}`)
    return res
  }

  // Si es la ruta raíz, redirigir a setup
  if (pathname === "/") {
    console.log(`[MIDDLEWARE] Redirecting root to setup`)
    return NextResponse.redirect(new URL("/setup", req.url))
  }

  // Si es login, permitir acceso
  if (pathname === "/login") {
    console.log(`[MIDDLEWARE] Allowing access to login`)
    return res
  }

  try {
    // Crear cliente de Supabase para el middleware
    const supabase = createMiddlewareClient({ req, res })

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log(`[MIDDLEWARE] Session check for ${pathname}:`, {
      hasSession: !!session,
      userEmail: session?.user?.email,
    })

    // Si no hay sesión, redirigir a login
    if (!session) {
      console.log(`[MIDDLEWARE] No session found for ${pathname}, redirecting to login`)
      return NextResponse.redirect(new URL("/login", req.url))
    }

    console.log(`[MIDDLEWARE] Session found for ${pathname}, allowing access`)
    return res
  } catch (error) {
    console.error(`[MIDDLEWARE] Error for ${pathname}:`, error)
    // En caso de error, permitir acceso para evitar loops
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto archivos estáticos
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
}
