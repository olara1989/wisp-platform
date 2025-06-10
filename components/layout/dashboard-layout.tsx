"use client"

import type React from "react"
import { memo } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Layout principal para las páginas del dashboard
 * Incluye el header y la barra lateral
 * Utiliza memo para evitar re-renderizados innecesarios
 *
 * @param children Contenido principal de la página
 */
export const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r md:block">
          <Sidebar />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
})
