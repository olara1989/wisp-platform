"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface RouteGuardProps {
  children: React.ReactNode
}

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/", "/login", "/register", "/public/pagos/[id]"]

// Mapa de rutas predeterminadas por rol al iniciar sesión o acceder a una ruta pública
const defaultRoutes: Record<string, string> = {
  admin: "/dashboard", // Ya estaba correcto
  cajero: "/pagos",
  tecnico: "/clientes", // Cambiado de /dashboard a /clientes
}

// Mapa de rutas permitidas por rol
const roleRoutes: Record<string, string[]> = {
  admin: [
    // El rol admin tiene acceso a todo, se mantienen las rutas existentes
    "/dashboard",
    "/clientes",
    "/clientes/nuevo",
    "/clientes/[id]",
    "/clientes/[id]/editar",
    "/planes",
    "/planes/nuevo",
    "/planes/[id]",
    "/planes/[id]/editar",
    "/planes/[id]/eliminar",
    "/routers",
    "/routers/nuevo",
    "/pagos",
    "/pagos/nuevo",
    "/usuarios",
    "/usuarios/nuevo",
    "/usuarios/[id]",
    "/usuarios/[id]/editar",
    "/usuarios/[id]/eliminar",
    "/test-connection",
    "/setup",
    "/debug",
    "/cortes",
    "/cortes/suspender",
  ],
  cajero: [
    "/clientes",
    "/clientes/nuevo",
    "/clientes/[id]",
    "/clientes/[id]/editar",
    "/pagos",
    "/pagos/nuevo",
    "/cortes", // Agregado
    "/cortes/suspender", // Agregado
  ],
  tecnico: [
    "/clientes",
    "/clientes/nuevo", // Asegurando que se pueda crear un cliente
    "/clientes/[id]",
    "/clientes/[id]/editar", // Asegurando que se pueda editar un cliente
  ],
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, userRole, isLoading } = useAuth() // 'initialized' eliminado
  const router = useRouter()
  const pathname = usePathname()

  // Función para verificar si la ruta actual es pública
  const isCurrentPathPublic = publicRoutes.includes(pathname) || publicRoutes.some(route => {
    if (route.includes("[id]")) {
      const base = route.split("[id]")[0]
      return pathname.startsWith(base)
    }
    return false
  })

  useEffect(() => {
    console.log("[ROUTE GUARD] Checking route:", { pathname, hasUser: !!user, isLoading, userRole })

    // Esperar solo si isLoading es true (incluye la carga inicial del rol)
    if (isLoading) {
      console.log("[ROUTE GUARD] Waiting for auth to load role.", { isLoading, user: !!user, userRole })
      return
    }

    if (isCurrentPathPublic) {
      console.log("[ROUTE GUARD] Public route, showing content")
      // Si el usuario está autenticado y en una ruta pública, redirigir a su página predeterminada
      if (user && userRole !== null && defaultRoutes[userRole]) { // userRole !== null check agregado
        console.log(`[ROUTE GUARD] User authenticated on public route (${pathname}), redirecting to default for role ${userRole}: ${defaultRoutes[userRole]}`)
        router.push(defaultRoutes[userRole])
      } else {
        console.log(`[ROUTE GUARD] Not redirecting from public route. User: ${!!user}, UserRole: ${userRole}, DefaultRoute: ${userRole !== null ? defaultRoutes[userRole] : 'N/A'}`)
      }
      return // Siempre mostrar contenido para rutas públicas o si no está logueado
    }

    // Si la ruta no es pública y no hay usuario, redirigir a login
    if (!user) {
      console.log("[ROUTE GUARD] No user, redirecting to login")
      router.push("/login")
      return
    }

    // Si el usuario está autenticado pero no tiene un rol válido (userRole es null), redirigir a login
    if (user && userRole === null) { // userRole === null y isLoading es false por la condición inicial
      console.log("[ROUTE GUARD] User has no valid role, redirecting to login")
      router.push("/login")
      return
    }

    // Si el usuario no tiene permiso para la ruta actual, redirigir a login
    if (!isRouteAllowed(pathname, userRole)) {
      console.log(`[ROUTE GUARD] User (${userRole}) does not have permission for this route (${pathname}), redirecting to login`)
      router.push("/login")
      return
    }

    console.log("[ROUTE GUARD] User authenticated, showing content")

  }, [pathname, user, userRole, isLoading, router]) // 'initialized' eliminado de las dependencias

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

  // Mostrar loading solo si isLoading es true y no es una ruta pública
  if (isLoading && !isCurrentPathPublic) {
    console.log("[ROUTE GUARD] Loading, showing spinner")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si no hay usuario y no es una ruta pública (y ya no estamos cargando), mostrar loading mientras redirige
  if (!user && !isCurrentPathPublic && !isLoading) {
    console.log("[ROUTE GUARD] No user, showing loading while redirecting")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si hay usuario, mostrar el contenido (si no se ha redirigido antes)
  return <>{children}</>
}