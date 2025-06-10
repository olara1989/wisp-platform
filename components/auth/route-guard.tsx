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
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  console.log("[ROUTE GUARD] Checking route:", { pathname, hasUser: !!user, isLoading })

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login", "/setup", "/debug", "/test-connection", "/test-page"]
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    // Solo redirigir si no estamos cargando, no hay usuario, y no es una ruta pública
    if (!isLoading && !user && !isPublicRoute) {
      console.log("[ROUTE GUARD] Redirecting to login from:", pathname)
      router.push("/login")
    }
  }, [user, isLoading, isPublicRoute, router, pathname])

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
