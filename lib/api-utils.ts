/**
 * Utilidades para manejar operaciones de API y Supabase
 */

import { toast } from "@/components/ui/use-toast"

/**
 * Maneja errores de Supabase de forma consistente
 * Muestra un toast con el mensaje de error y lanza una excepción
 *
 * @param error Error de Supabase o cualquier otro error
 * @param customMessage Mensaje personalizado opcional
 */
export function handleSupabaseError(error: any, customMessage?: string): never {
  console.error("Error de Supabase:", error)

  // Determinar el mensaje de error apropiado
  let errorMessage = customMessage || "Ocurrió un error inesperado"

  if (error?.message) {
    errorMessage = error.message
  } else if (error?.error_description) {
    errorMessage = error.error_description
  } else if (typeof error === "string") {
    errorMessage = error
  }

  // Si estamos en el cliente, mostrar un toast
  if (typeof window !== "undefined") {
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    })
  }

  throw new Error(errorMessage)
}

/**
 * Verifica si un plan puede ser eliminado
 * Comprueba si hay facturaciones que usan este plan
 *
 * @param supabase Cliente de Supabase
 * @param planId ID del plan a verificar
 * @returns Objeto con canDelete (booleano) y message (mensaje de error opcional)
 */
export async function canDeletePlan(supabase: any, planId: string): Promise<{ canDelete: boolean; message?: string }> {
  try {
    // Verificar si hay facturaciones que usan este plan
    const { data: facturaciones, error: factError } = await supabase
      .from("facturacion")
      .select("id")
      .eq("plan_id", planId)
      .limit(1)

    if (factError) throw factError

    // Si hay facturaciones, no se puede eliminar
    if (facturaciones && facturaciones.length > 0) {
      return {
        canDelete: false,
        message: "No se puede eliminar el plan porque está siendo utilizado en facturaciones",
      }
    }

    // Si llegamos aquí, el plan puede ser eliminado
    return { canDelete: true }
  } catch (error) {
    console.error("Error al verificar si el plan puede ser eliminado:", error)
    return {
      canDelete: false,
      message: "Error al verificar si el plan puede ser eliminado",
    }
  }
}
