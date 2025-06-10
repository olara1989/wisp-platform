import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar conexión a la base de datos
    const { data: testConnection } = await supabase.from("usuarios").select("count").limit(1)

    if (!testConnection) {
      throw new Error("No se pudo conectar a la base de datos")
    }

    // Verificar si el usuario ya existe en la tabla usuarios
    const { data: existingUser } = await supabase.from("usuarios").select("id").eq("email", "admin@wisp.com").single()

    if (!existingUser) {
      // Insertar usuario en la tabla usuarios
      const { error: userError } = await supabase.from("usuarios").insert({
        nombre: "Administrador",
        rol: "admin",
        email: "admin@wisp.com",
        password_hash: "$2a$10$dummy.hash.for.testing",
      })

      if (userError) {
        console.error("Error al insertar usuario:", userError)
        throw new Error(`Error al crear usuario en la tabla: ${userError.message}`)
      }
    }

    // Verificar si el usuario ya existe en Auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const userExists = existingUsers.users.some((user) => user.email === "admin@wisp.com")

    if (!userExists) {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: "admin@wisp.com",
        password: "admin123",
        email_confirm: true,
      })

      if (authError) {
        console.error("Error al crear usuario en Auth:", authError)
        throw new Error(`Error al crear usuario en Auth: ${authError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: "Usuario de prueba creado correctamente",
        user: authData.user,
      })
    } else {
      return NextResponse.json({
        success: true,
        message: "Usuario de prueba ya existe y está configurado",
        user: "Usuario ya configurado",
      })
    }
  } catch (error: any) {
    console.error("Error setting up test user:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al configurar usuario de prueba",
        details: error.stack || "Sin detalles adicionales",
      },
      { status: 500 },
    )
  }
}
