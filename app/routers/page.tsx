import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase"
import { Plus } from "lucide-react"

async function getRouters() {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("routers").select("*").order("nombre")

  if (error) {
    console.error("Error al obtener routers:", error)
    return []
  }

  return data || []
}

export default async function RoutersPage() {
  const routers = await getRouters()

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Routers Mikrotik</h1>
        <Button asChild>
          <Link href="/routers/nuevo">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Router
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routers Configurados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Puerto API</TableHead>
                <TableHead>Modo Control</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No hay routers configurados
                  </TableCell>
                </TableRow>
              ) : (
                routers.map((router) => (
                  <TableRow key={router.id}>
                    <TableCell className="font-medium">{router.nombre}</TableCell>
                    <TableCell>{router.ip}</TableCell>
                    <TableCell>{router.puerto_api || 8728}</TableCell>
                    <TableCell>{router.modo_control}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/routers/${router.id}`}>Editar</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
