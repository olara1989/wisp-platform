"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Loader2 } from "lucide-react"

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, isLoading, userRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  console.log("[ROUTE GUARD] Checking route:", { pathname, hasUser: !!user, isLoading })

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login", "/setup", "/debug", "/test-connection", "/test-page"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // Mapa de rutas permitidas por rol
  const roleRoutes: Record<string, string[]> = {
    admin: [
      "/dashboard",
      "/clientes",
      "/clientes/nuevo",
      "/clientes/[id]",
      "/clientes/[id]/editar",
      "/planes",
      "/pagos",
      "/pagos/nuevo",
      "/cortes",
      "/routers",
      "/dispositivos",
      "/configuracion",
      // Agrega más rutas si es necesario
    ],
    tecnico: [
      "/clientes",
      "/clientes/nuevo",
      "/clientes/[id]",
      "/clientes/[id]/editar",
    ],
    cajero: [
      "/pagos",
      "/pagos/nuevo",
      "/cortes",
    ],
  }

  // Función para verificar si la ruta está permitida para el rol
  function isRouteAllowed(path: string, role: string | null) {
    console.log(`[ROUTE GUARD][isRouteAllowed] Checking path: ${path}, for role: ${role}`)
    if (!role) {
      console.log("[ROUTE GUARD][isRouteAllowed] No role, returning false")
      return false
    }
    const allowed = roleRoutes[role]
    if (!allowed) {
      console.log(`[ROUTE GUARD][isRouteAllowed] No allowed routes for role: ${role}, returning false`)
      return false
    }

    const isAllowed = allowed.some((route) => {
      if (route.includes("[id]")) {
        const base = route.split("[id]")[0]
        const match = path.startsWith(base)
        console.log(`[ROUTE GUARD][isRouteAllowed] Dynamic route check - base: ${base}, path: ${path}, match: ${match}`)
        return match
      }
      const match = path === route
      console.log(`[ROUTE GUARD][isRouteAllowed] Exact route check - route: ${route}, path: ${path}, match: ${match}`)
      return match
    })
    console.log(`[ROUTE GUARD][isRouteAllowed] Final result for path ${path} and role ${role}: ${isAllowed}`)
    return isAllowed
  }

  useEffect(() => {
    // Solo redirigir si no estamos cargando, no hay usuario, y no es una ruta pública
    if (!isLoading && !user && !isPublicRoute) {
      console.log("[ROUTE GUARD] Redirecting to login from:", pathname)
      router.push("/login")
    }
    // Si hay usuario pero no tiene permiso para la ruta, redirigir a login
    if (!isLoading && user && !isPublicRoute && !isRouteAllowed(pathname, userRole)) {
      console.log("[ROUTE GUARD] User does not have permission for this route, redirecting to login")
      router.push("/login")
    }
    // Si hay usuario y está en /login, redirigir a /dashboard
    if (!isLoading && user && pathname === "/login") {
      console.log("[ROUTE GUARD] Usuario autenticado en /login, redirigiendo a /dashboard")
      router.push("/dashboard")
    }
  }, [user, isLoading, isPublicRoute, router, pathname, userRole])

  // Si es una ruta pública, siempre mostrar el contenido
  if (isPublicRoute) {
    console.log("[ROUTE GUARD] Public route, showing content")
    return <>{children}</>
  }

  // Si estamos cargando en una ruta protegida, mostrar loading
  if (isLoading) {
    console.log("[ROUTE GUARD] Loading, showing spinner")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si no hay usuario en una ruta protegida, mostrar loading mientras redirige
  if (!user) {
    console.log("[ROUTE GUARD] No user, showing loading while redirecting")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si hay usuario, mostrar el contenido
  console.log("[ROUTE GUARD] User authenticated, showing content")
  return <>{children}</>
}
