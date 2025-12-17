/**
 * Configuración y utilidades para la conexión con Supabase
 * Este archivo implementa el patrón Singleton para los clientes de Supabase
 * y maneja la conexión tanto del lado del servidor como del cliente.
 */

import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * Singleton para el cliente de Supabase del lado del servidor
 * Se utiliza para operaciones que requieren permisos elevados
 * como la gestión de usuarios o operaciones administrativas
 */
let serverSingleton: ReturnType<typeof createClient> | null = null

/**
 * Singleton para el cliente de Supabase del lado del cliente
 * Se utiliza para operaciones del usuario autenticado
 * como consultas a datos protegidos o actualizaciones de perfil
 */
let clientSingleton: ReturnType<typeof createClientComponentClient> | null = null

/**
 * Crea o reutiliza un cliente de Supabase para operaciones del lado del servidor
 * 
 * Características:
 * - Usa la service role key para permisos elevados
 * - No persiste sesiones (no necesario en el servidor)
 * - Desactiva el auto-refresh de tokens
 * 
 * @returns Cliente de Supabase configurado para el servidor
 * @throws Error si faltan variables de entorno necesarias
 */
export const createServerSupabaseClient = () => {
  if (serverSingleton) return serverSingleton

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables")
  }

  serverSingleton = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return serverSingleton
}

/**
 * Crea o reutiliza un cliente de Supabase para operaciones del lado del cliente
 * 
 * Características:
 * - Usa el cliente de componentes de Next.js
 * - Maneja automáticamente la autenticación del usuario
 * - Persiste la sesión en el navegador
 * 
 * @returns Cliente de Supabase configurado para el cliente
 */
export const createClientSupabaseClient = () => {
  if (typeof window === "undefined") {
    return createServerSupabaseClient()
  }

  if (clientSingleton) return clientSingleton

  clientSingleton = createClientComponentClient()
  return clientSingleton
}

export const getCurrentUserRole = async (): Promise<string | null> => {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.user?.email) {
    return null;
  }

  const { data: roleData, error } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("email", session.user.email)
    .single<{ rol: string | null }>();

  if (error) {
    console.error("Error fetching user role from server:", error);
    return null;
  }

  return roleData?.rol || null;
};
