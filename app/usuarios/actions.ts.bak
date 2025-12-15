"use server";

import { createServerSupabaseClient, getCurrentUserRole } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function createUsuario(formData: FormData) {
  const userRole = await getCurrentUserRole();

  if (userRole !== "admin") {
    // Lanzar un error o redirigir a una página de acceso denegado
    throw new Error("Acceso no autorizado para crear usuarios.");
  }

  const nombre = formData.get("nombre") as string;
  const email = formData.get("email") as string;
  const rol = formData.get("rol") as string;
  const password = formData.get("password") as string;
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("usuarios").insert({
    nombre,
    email,
    rol,
    password_hash: password,
  });

  if (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user.");
  }

  // Opcional: Crear usuario también en Supabase Auth si es necesario y aún no se ha hecho
  // En tu `app/api/auth/setup/route.ts` ya manejas la creación del usuario `admin@wisp.com` en Auth.
  // Si permites que los usuarios se creen directamente desde aquí y necesiten iniciar sesión,
  // deberías considerar crear el usuario también en `auth.users` aquí si no lo haces en otro lugar.
  // Por ahora, asumimos que la gestión de usuarios Auth se hace por separado si no es admin.

  redirect("/usuarios");
} 