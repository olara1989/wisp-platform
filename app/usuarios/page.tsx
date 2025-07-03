import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function UsuariosPage() {
  // Obtener la cookie de sesión
  const cookieStore = cookies()
  const supabase = createServerSupabaseClient()

  // Obtener el usuario autenticado por la cookie
  const { data: { session } } = await supabase.auth.getSession()
  const email = session?.user?.email

  // Consultar el rol en la tabla usuarios
  let userRole = null
  if (email) {
    const { data: usuario } = await supabase.from("usuarios").select("rol").eq("email", email).single()
    userRole = usuario?.rol
  }
  if (userRole !== "admin") {
    redirect("/login")
  }

  const { data: usuarios } = await supabase.from("usuarios").select("id, nombre, email, rol, created_at")

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Button asChild>
          <Link href="/usuarios/nuevo">Nuevo Usuario</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios?.map((usuario: any) => (
                <TableRow key={usuario.id}>
                  <TableCell>{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.rol}</TableCell>
                  <TableCell>{usuario.created_at?.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/usuarios/${usuario.id}/editar`}>Editar</Link>
                    </Button>
                    <Button asChild size="sm" variant="destructive">
                      <Link href={`/usuarios/${usuario.id}/eliminar`}>Eliminar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
} 