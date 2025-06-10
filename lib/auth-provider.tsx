/**
 * Sistema de Autenticación de WISP Manager
 * 
 * Este archivo implementa el contexto de autenticación usando React Context API
 * y maneja toda la lógica de autenticación con Supabase.
 * 
 * Características principales:
 * - Gestión de sesiones de usuario
 * - Control de acceso basado en roles
 * - Redirección automática para rutas protegidas
 * - Estado de carga global
 */

"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

/**
 * Tipo que define la estructura del contexto de autenticación
 */
type AuthContextType = {
  user: User | null          // Usuario actual autenticado
  signIn: (email: string, password: string) => Promise<any>  // Función para iniciar sesión
  signOut: () => Promise<void>  // Función para cerrar sesión
  isLoading: boolean        // Estado de carga de la autenticación
  userRole: string | null   // Rol del usuario actual
}

// Creación del contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Proveedor de Autenticación
 * 
 * Este componente:
 * 1. Maneja el estado global de autenticación
 * 2. Proporciona métodos para iniciar/cerrar sesión
 * 3. Controla el acceso a rutas protegidas
 * 4. Muestra estados de carga
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  console.log("[AUTH PROVIDER] Rendering with:", { pathname, isLoading, hasUser: !!user })

  // Rutas que no requieren autenticación
  const publicRoutes = ["/login", "/setup", "/debug", "/test-connection", "/test-page"]
  const isPublicRoute = publicRoutes.includes(pathname)

  /**
   * Efecto para inicializar la autenticación
   * Se ejecuta una sola vez al montar el componente
   */
  useEffect(() => {
    if (initialized) return

    console.log("[AUTH PROVIDER] Initializing auth...")

    const initAuth = async () => {
      try {
        const supabase = createClientSupabaseClient()

        // Obtener sesión actual
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("[AUTH PROVIDER] Initial session check:", {
          hasSession: !!session,
          pathname,
          isPublicRoute,
          userEmail: session?.user?.email,
        })

        if (session?.user) {
          setUser(session.user)
          setUserRole("admin") // Por ahora, asignar admin por defecto
        } else {
          setUser(null)
          setUserRole(null)
        }

        // Configurar listener para cambios de autenticación
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("[AUTH PROVIDER] Auth state change:", { event, hasSession: !!session })

          if (session?.user) {
            setUser(session.user)
            setUserRole("admin")
          } else {
            setUser(null)
            setUserRole(null)
          }
        })

        setInitialized(true)

        // Cleanup function
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("[AUTH PROVIDER] Error initializing auth:", error)
        setUser(null)
        setUserRole(null)
        setInitialized(true)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [initialized, pathname, isPublicRoute])

  /**
   * Función para iniciar sesión
   * @param email - Correo electrónico del usuario
   * @param password - Contraseña del usuario
   */
  const signIn = async (email: string, password: string) => {
    try {
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("[AUTH PROVIDER] Sign in error:", error)
      throw error
    }
  }

  /**
   * Función para cerrar sesión
   * Redirige al usuario a la página de login
   */
  const signOut = async () => {
    try {
      const supabase = createClientSupabaseClient()
      await supabase.auth.signOut()
      setUser(null)
      setUserRole(null)
      router.push("/login")
    } catch (error) {
      console.error("[AUTH PROVIDER] Sign out error:", error)
    }
  }

  // Mostrar loading solo en rutas protegidas
  if (isLoading && !isPublicRoute) {
    console.log("[AUTH PROVIDER] Showing loading for protected route")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <AuthContext.Provider value={{ user, signIn, signOut, isLoading, userRole }}>{children}</AuthContext.Provider>
}

/**
 * Hook personalizado para usar el contexto de autenticación
 * @returns El contexto de autenticación
 * @throws Error si se usa fuera del AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
