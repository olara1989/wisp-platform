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

// Rutas exclusivas para invitados (si estás logueado, te redirige al dashboard)
const guestOnlyRoutes = ["/", "/login", "/register"]

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
    "/recibos",
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
    "/recibos", // Agregado
  ],
  tecnico: [
    "/clientes",
    "/clientes/nuevo", // Asegurando que se pueda crear un cliente
    "/clientes/[id]",
    "/clientes/[id]/editar", // Asegurando que se pueda editar un cliente
    "/planes",
    "/dispositivos",
    "/routers",
    "/cortes", // Agregado
    "/cortes/suspender", // Agregado
    "/recibos", // Agregado
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

    // Si no hay usuario y estamos cargando, esperar
    // Si hay usuario pero estamos cargando el rol, permitir renderizado optimista
    if (isLoading && !user) {
      console.log("[ROUTE GUARD] Waiting for auth to load (no user yet).", { isLoading, user: !!user, userRole })
      return
    }

    // Si tenemos usuario pero no rol todavía, esperar un momento para que se cargue
    // pero no bloquear si ya pasó suficiente tiempo
    if (isLoading && user && userRole === null) {
      console.log("[ROUTE GUARD] User authenticated, waiting for role (non-blocking).", { isLoading, user: !!user, userRole })
      // No retornar aquí - permitir que continúe para verificar permisos después
    }

    if (isCurrentPathPublic) {
      console.log("[ROUTE GUARD] Public route, showing content")

      // Verificar si es una ruta solo para invitados (login, register, home)
      const isGuestOnly = guestOnlyRoutes.includes(pathname)

      // Si el usuario está autenticado y en una ruta SOLO para invitados, redirigir a su página predeterminada
      // SI es una ruta pública de contenido (como /public/pagos/...), NO redirigir
      if (user && userRole !== null && defaultRoutes[userRole] && isGuestOnly) {
        console.log(`[ROUTE GUARD] User authenticated on guest-only route (${pathname}), redirecting to default for role ${userRole}: ${defaultRoutes[userRole]}`)
        router.push(defaultRoutes[userRole])
      } else {
        console.log(`[ROUTE GUARD] Not redirecting from public route. User: ${!!user}, UserRole: ${userRole}, GuestOnly: ${isGuestOnly}`)
      }
      return // Siempre mostrar contenido para rutas públicas o si no está logueado
    }

    // Si la ruta no es pública y no hay usuario, redirigir a login
    if (!user) {
      console.log("[ROUTE GUARD] No user, redirecting to login")
      router.push("/login")
      return
    }

    // Si aún estamos cargando el rol, permitir contenido temporalmente (optimistic render)
    // El servidor ya verificó permisos, así que es seguro mostrar el contenido
    if (user && userRole === null && isLoading) {
      console.log("[ROUTE GUARD] User authenticated, role loading in progress - allowing optimistic render")
      return // Permitir mostrar contenido mientras se carga el rol
    }

    // Si el usuario está autenticado pero no tiene un rol válido (userRole es null) Y ya no estamos cargando
    if (user && userRole === null && !isLoading) {
      console.log("[ROUTE GUARD] User has no valid role after loading, redirecting to login")
      router.push("/login")
      return
    }

    // Si el usuario no tiene permiso para la ruta actual, redirigir a login
    // Solo verificar si ya tenemos el rol cargado
    if (userRole && !isRouteAllowed(pathname, userRole)) {
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

  // Mostrar loading solo si no hay usuario Y estamos cargando (no para carga de rol)
  if (isLoading && !user && !isCurrentPathPublic) {
    console.log("[ROUTE GUARD] Loading, showing spinner (no user)")
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