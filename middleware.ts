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
    pathname === "/test-connection" ||
    pathname === "/debug"
  ) {
    return res
  }

  // Dejamos que la protección de rutas se maneje en el cliente (AuthProvider)
  // ya que no tenemos Firebase Admin SDK para verificar cookies en el servidor fácilmente.

  return res
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto archivos estáticos
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
}
