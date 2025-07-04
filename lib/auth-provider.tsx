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

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createClientSupabaseClient as createClient } from "@/lib/supabase"
import {
  AuthSession,
  Session,
  User,
} from "@supabase/supabase-js"
import { toast } from "@/components/ui/use-toast"

/**
 * Tipo que define la estructura del contexto de autenticación
 */
interface AuthContextType {
  session: Session | null
  user: User | null          // Usuario actual autenticado
  userRole: string | null   // Rol del usuario actual
  isLoading: boolean        // Estado de carga de la autenticación
  signIn: (email: string, password: string) => Promise<void>  // Función para iniciar sesión
  signOut: () => Promise<void>  // Función para cerrar sesión
  checkAuth: () => Promise<void>  // Función para verificar la autenticación
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
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  console.log("[AUTH PROVIDER] Rendering with:", { pathname, isLoading, hasUser: !!user })

  // Rutas que no requieren autenticación
  const publicRoutes = ["/", "/login", "/register", "/public/pagos/[id]"]
  const isPublicRoute = publicRoutes.includes(pathname) || publicRoutes.some(route => {
    if (route.includes("[id]")) {
      const base = route.split("[id]")[0]
      return pathname.startsWith(base)
    }
    return false
  })

  const checkAuth = useCallback(async () => {
    console.log("[AUTH PROVIDER][checkAuth] Starting checkAuth.");
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user || null);
    console.log("[AUTH PROVIDER][checkAuth] Session and user set:", { hasSession: !!session, hasUser: !!session?.user });

    if (session && session.user?.email) {
      console.log("[AUTH PROVIDER][checkAuth] Fetching user role for user email:", session.user.email);
      const { data: roleData, error: roleError } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("email", session.user.email)
        .single<{ rol: string | null }>();

      if (roleError) {
        console.error("[AUTH PROVIDER][checkAuth] Error fetching user role:", roleError);
        setUserRole(null);
      } else {
        setUserRole(roleData?.rol || null);
        console.log("[AUTH PROVIDER][checkAuth] User role set to:", roleData?.rol || null);
      }
    } else {
      setUserRole(null);
      console.log("[AUTH PROVIDER][checkAuth] No session or email, user role set to null.");
    }
    setIsLoading(false);
    console.log("[AUTH PROVIDER][checkAuth] Finished checkAuth. IsLoading:", false, "UserRole:", userRole);
  }, [supabase, userRole]);

  /**
   * Efecto para inicializar la autenticación
   * Se ejecuta una sola vez al montar el componente
   */
  useEffect(() => {
    console.log("[AUTH PROVIDER][useEffect] Initializing auth (useEffect)...");
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        console.log("[AUTH PROVIDER][onAuthStateChange] Auth state change detected:", { _event, hasSession: !!session });
        setIsLoading(true);
        setSession(session);
        setUser(session?.user || null);

        if (session && session.user?.email) {
          console.log("[AUTH PROVIDER][onAuthStateChange] Fetching user role for user email:", session.user.email);
          const { data: roleData, error: roleError } = await supabase
            .from("usuarios")
            .select("rol")
            .eq("email", session.user.email)
            .single<{ rol: string | null }>();

          if (roleError) {
            console.error("[AUTH PROVIDER][onAuthStateChange] Error fetching user role:", roleError);
            setUserRole(null);
          } else {
            setUserRole(roleData?.rol || null);
            console.log("[AUTH PROVIDER][onAuthStateChange] User role set to:", roleData?.rol || null);
          }
        } else {
          setUserRole(null);
          console.log("[AUTH PROVIDER][onAuthStateChange] No session or email, user role set to null.");
        }
        setIsLoading(false);
        console.log("[AUTH PROVIDER][onAuthStateChange] Finished auth state change. IsLoading:", false, "UserRole:", userRole);
      },
    );

    return () => {
      if (authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [checkAuth, supabase, userRole]);

  /**
   * Función para iniciar sesión
   * @param email - Correo electrónico del usuario
   * @param password - Contraseña del usuario
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        console.log("[AUTH PROVIDER][signIn] Intentando login con:", { email, password })
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        console.log("[AUTH PROVIDER][signIn] Respuesta de Supabase:", { error })
        if (error) {
          throw error
        }
        await checkAuth()
        setIsLoading(false)
      } catch (error) {
        console.error("[AUTH PROVIDER][signIn] Error en signIn:", error)
        throw error
      }
    },
    [supabase, checkAuth],
  )

  /**
   * Función para cerrar sesión
   * Redirige al usuario a la página de login
   */
  const signOut = useCallback(async () => {
    try {
      console.log("[AUTH PROVIDER] Signing out...")
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      console.log("[AUTH PROVIDER] Sign out response:", { error })
      if (error) {
        console.error("Error signing out:", error)
        toast({
          title: "Error al cerrar sesión",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setSession(null)
        setUser(null)
        setUserRole(null)
        router.push("/login")
      }
    } catch (error) {
      console.error("[AUTH PROVIDER] Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router])

  // Mostrar loading solo en rutas protegidas
  if (isLoading && !isPublicRoute) {
    console.log("[AUTH PROVIDER] Showing loading for protected route")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <AuthContext.Provider value={{ session, user, userRole, isLoading, signIn, signOut, checkAuth }}>{children}</AuthContext.Provider>
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
