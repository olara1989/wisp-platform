"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { memo, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-provider"
import { Users, Home, Package, CreditCard, Router, Settings, Wifi, AlertTriangle, LogOut } from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Barra lateral de navegación
 * Muestra enlaces a las diferentes secciones según el rol del usuario
 * Utiliza memo y useMemo para optimizar el rendimiento
 *
 * @param className Clases adicionales para el componente
 */
export const Sidebar = memo(function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { signOut, userRole } = useAuth()

  const isAdmin = userRole === "admin"
  const isTecnico = userRole === "tecnico" || isAdmin
  const isCajero = userRole === "cajero" || isAdmin

  // Definir las rutas disponibles con sus permisos
  // useMemo evita recalcular en cada renderizado
  const routes = useMemo(
    () => [
      {
        label: "Dashboard",
        icon: Home,
        href: "/dashboard",
        active: pathname === "/dashboard",
        roles: ["admin", "tecnico"],
      },
      {
        label: "Clientes",
        icon: Users,
        href: "/clientes",
        active: pathname.startsWith("/clientes"),
        roles: ["admin", "tecnico", "cajero"],
      },
      {
        label: "Planes",
        icon: Package,
        href: "/planes",
        active: pathname.startsWith("/planes"),
        roles: ["admin", "tecnico"],
      },
      {
        label: "Pagos",
        icon: CreditCard,
        href: "/pagos",
        active: pathname.startsWith("/pagos"),
        roles: ["admin", "cajero"],
      },
      {
        label: "Dispositivos",
        icon: Wifi,
        href: "/dispositivos",
        active: pathname.startsWith("/dispositivos"),
        roles: ["admin", "tecnico"],
      },
      {
        label: "Routers",
        icon: Router,
        href: "/routers",
        active: pathname.startsWith("/routers"),
        roles: ["admin", "tecnico"],
      },
      {
        label: "Cortes Pendientes",
        icon: AlertTriangle,
        href: "/cortes",
        active: pathname.startsWith("/cortes"),
        roles: ["admin", "tecnico", "cajero"],
      },
      {
        label: "Configuración",
        icon: Settings,
        href: "/configuracion",
        active: pathname.startsWith("/configuracion"),
        roles: ["admin"],
      },
    ],
    [pathname, userRole],
  )

  // Filtrar rutas según el rol del usuario
  const filteredRoutes = userRole ? routes.filter(route => route.roles.includes(userRole)) : [];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">WISP Manager</h2>
          <div className="space-y-1">
            <ScrollArea className="h-[calc(100vh-10rem)]">
              {filteredRoutes.map((route) => (
                <Button
                  key={route.href}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded w-full justify-start transition-colors duration-200",
                    route.active
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                  asChild
                >
                  <Link href={route.href}>
                    <route.icon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 inline" />
                    {route.label}
                  </Link>
                </Button>
              ))}
              {/* Enlace a Usuarios solo para admin */}
              {userRole === "admin" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded w-full justify-start transition-colors duration-200",
                    pathname === "/usuarios"
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                  asChild
                >
                  <Link href="/usuarios">
                    <Users className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 inline" />
                    Usuarios
                  </Link>
                </Button>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
      <div className="px-3 py-2 mt-auto border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 inline" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
})
