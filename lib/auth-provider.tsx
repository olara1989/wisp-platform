/**
 * Sistema de Autenticación de WISP Manager (Firebase)
 * 
 * Este archivo implementa el contexto de autenticación usando React Context API
 * y maneja toda la lógica de autenticación con Firebase.
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
import { auth, db } from "@/lib/firebase"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { toast } from "@/components/ui/use-toast"

/**
 * Tipo que define la estructura del contexto de autenticación
 */
interface AuthContextType {
  user: User | null          // Usuario actual autenticado
  userRole: string | null   // Rol del usuario actual
  isLoading: boolean        // Estado de carga de la autenticación
  signIn: (email: string, password: string) => Promise<void>  // Función para iniciar sesión
  signOut: () => Promise<void>  // Función para cerrar sesión
  checkAuth: () => Promise<void>  // Función para verificar la autenticación
}

// Creación del contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cache para el rol del usuario
const userRoleCache = new Map<string, { role: string | null, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

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

  // Función auxiliar para obtener el rol
  const fetchUserRole = async (currentUser: User | null) => {
    if (!currentUser || !currentUser.email) return null;

    const email = currentUser.email;
    const now = Date.now();
    const cached = userRoleCache.get(email);

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log("[AUTH PROVIDER] Using cached role for:", email);
      return cached.role;
    }

    try {
      console.log("[AUTH PROVIDER] Fetching user role from Firestore for:", email);
      // Asumimos que la colección se llama "usuarios" y el documento ID podría ser el UID o buscamos por email
      // Dado que en SQL el ID era UUID, en Firestore idealmente usaríamos el UID de Auth como ID del documento.
      // Si no, tendríamos que hacer una query. Por ahora intentaré hacer un query por email.

      const q = await import("firebase/firestore").then(pkg => {
        const { collection, query, where, getDocs } = pkg;
        return getDocs(query(collection(db, "usuarios"), where("email", "==", email)));
      });

      if (!q.empty) {
        const userData = q.docs[0].data();
        const role = userData.rol;
        userRoleCache.set(email, { role, timestamp: now });
        return role;
      }
      return null;
    } catch (error) {
      console.error("[AUTH PROVIDER] Error fetching role:", error);
      return null;
    }
  };

  const checkAuth = useCallback(async () => {
    // En Firebase, el estado se maneja con el listener, pero podemos forzar una actualización si es necesario
    if (auth.currentUser) {
      const role = await fetchUserRole(auth.currentUser);
      setUserRole(role);
    }
  }, []);

  /**
   * Efecto para inicializar la autenticación
   */
  useEffect(() => {
    console.log("[AUTH PROVIDER] Initializing auth listener...");

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("[AUTH PROVIDER] Auth state changed:", { hasUser: !!currentUser });
      setUser(currentUser);

      if (currentUser) {
        const role = await fetchUserRole(currentUser);
        setUserRole(role);
      } else {
        setUserRole(null);
        if (userRoleCache.size > 0) userRoleCache.clear();
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Función para iniciar sesión
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        console.log("[AUTH PROVIDER] Attempting login with:", { email })
        setIsLoading(true)
        await signInWithEmailAndPassword(auth, email, password)
        // El listener de onAuthStateChanged se encargará del resto
      } catch (error: any) {
        console.error("[AUTH PROVIDER] Sign in error:", error)
        setIsLoading(false) // Restore loading state on error
        throw error
      }
    },
    []
  )

  /**
   * Función para cerrar sesión
   */
  const signOut = useCallback(async () => {
    try {
      console.log("[AUTH PROVIDER] Signing out...")
      setIsLoading(true)
      await firebaseSignOut(auth)
      setUser(null)
      setUserRole(null)
      userRoleCache.clear()
      router.push("/login")
    } catch (error: any) {
      console.error("Error signing out:", error)
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Lógica de redirección y protección básica
  // Nota: Lo ideal es que cada página o layout proteja su contenido, 
  // pero aquí podemos manejar redirecciones globales si no estamos cargando
  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) {
      console.log("[AUTH PROVIDER] Unauthenticated on protected route, redirecting to /login");
      router.push("/login");
    }
  }, [isLoading, user, isPublicRoute, router]);

  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si no carga, y no hay usuario en ruta protegida, el useEffect arriba redirigirá.
  // Podríamos retornar null aquí para evitar flash, pero dejamos que renderice por si acaso.

  return <AuthContext.Provider value={{ user, userRole, isLoading, signIn, signOut, checkAuth }}>{children}</AuthContext.Provider>
}

/**
 * Hook personalizado para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

