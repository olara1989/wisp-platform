/**
 * Layout principal de la aplicación WISP Manager
 * Este archivo define la estructura base de todas las páginas
 * y configura los providers globales necesarios.
 */

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-provider"
import { RouteGuard } from "@/components/auth/route-guard"

// Configuración de la fuente Inter de Google Fonts
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

// Metadatos de la aplicación para SEO y navegador
export const metadata = {
  title: "WISP Manager",
  description: "Plataforma de gestión para proveedores de internet inalámbrico",
  generator: 'v0.dev'
}

/**
 * RootLayout: Componente raíz que envuelve toda la aplicación
 * @param children - Componentes hijos que se renderizarán dentro del layout
 * 
 * Estructura de providers (de afuera hacia adentro):
 * 1. ThemeProvider: Maneja el tema claro/oscuro de la aplicación
 * 2. AuthProvider: Gestiona el estado de autenticación global
 * 3. RouteGuard: Protege las rutas basado en autenticación y permisos
 * 4. Toaster: Sistema de notificaciones global
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RouteGuard>
              {children}
              <Toaster />
            </RouteGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
