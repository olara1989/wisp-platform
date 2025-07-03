import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-provider"

export default async function EditarUsuarioPage({ params }: { params: { id: string } }) {
  const { userRole } = useAuth();
  if (userRole !== "admin") {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()
  const { data: usuario } = await supabase.from("usuarios").select("id, nombre, email, rol").eq("id", params.id).single()

  async function handleSubmit(formData: FormData) {
    "use server"
    const nombre = formData.get("nombre") as string
    const email = formData.get("email") as string
    const rol = formData.get("rol") as string
    await supabase.from("usuarios").update({ nombre, email, rol }).eq("id", params.id)
    redirect("/usuarios")
  }

  if (!usuario) {
    return <div className="p-8 text-center">Usuario no encontrado</div>
  }

  return (
    <DashboardLayout>
      <Card className="max-w-lg mx-auto mt-8">
        <CardHeader>
          <CardTitle>Editar Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" defaultValue={String(usuario.nombre)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={String(usuario.email)} required />
            </div>
            <div>
              <Label htmlFor="rol">Rol</Label>
              <select id="rol" name="rol" className="border rounded px-2 py-2 w-full" defaultValue={String(usuario.rol)} required>
                <option value="admin">Administrador</option>
                <option value="tecnico">Técnico</option>
                <option value="cajero">Cajero</option>
              </select>
            </div>
            <Button type="submit" className="w-full">Guardar Cambios</Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
} 