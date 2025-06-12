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
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow py-6 md:block transition-colors duration-200">
          <Sidebar />
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mx-auto w-full max-w-7xl">{children}</main>
      </div>
    </div>
  )
})
