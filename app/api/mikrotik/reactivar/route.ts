import { NextResponse } from "next/server"
import { createServerSupabaseClient, getCurrentUserRole } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const userRole = await getCurrentUserRole();

    if (userRole !== "admin" && userRole !== "tecnico") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 });
    }

    const { routerId, clienteIp, metodo } = await request.json()

    // Obtener información del router
    const supabase = createServerSupabaseClient()
    const { data: router, error } = await supabase.from("routers").select("*").eq("id", routerId).single()

    if (error || !router) {
      return NextResponse.json({ error: "Router no encontrado" }, { status: 404 })
    }

    // En producción, aquí se conectaría realmente a Mikrotik
    // Por ahora, simulamos una respuesta exitosa para evitar problemas con dependencias

    // Actualizar estado del cliente
    const { data: dispositivo } = await supabase.from("dispositivos").select("cliente_id").eq("ip", clienteIp).single()

    if (dispositivo) {
      await supabase.from("clientes").update({ estado: "activo" }).eq("id", dispositivo.cliente_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en reactivarCliente:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
        details: error instanceof Error ? error.stack : "No hay detalles disponibles",
      },
      { status: 500 },
    )
  }
}
