import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createServerSupabaseClient } from "@/lib/supabase"
import { formatDate, getEstadoColor } from "@/lib/utils"
import { Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cache } from "react"

// Usar cache para evitar múltiples llamadas a la base de datos
const getClientes = cache(async (estado?: string, buscar?: string) => {
  try {
    const supabase = createServerSupabaseClient()

    let query = supabase.from("clientes").select("*").order("nombre")

    // Filtrar por estado si se proporciona
    if (estado && estado !== "todos") {
      query = query.eq("estado", estado)
    }

    // Buscar por nombre, email o teléfono
    if (buscar) {
      query = query.or(`nombre.ilike.%${buscar}%,email.ilike.%${buscar}%,telefono.ilike.%${buscar}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener clientes:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return []
  }
})

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { estado?: string; buscar?: string }
}) {
  const clientes = await getClientes(searchParams.estado, searchParams.buscar)

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button asChild>
          <Link href="/clientes/nuevo">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra la lista de clientes por estado o busca por nombre, email o teléfono</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select name="estado" defaultValue={searchParams.estado || "todos"}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="moroso">Moroso</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                name="buscar"
                placeholder="Buscar por nombre, email o teléfono"
                defaultValue={searchParams.buscar || ""}
                className="flex-1"
              />
            </div>

            <Button type="submit">Aplicar Filtros</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha Alta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No se encontraron clientes con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nombre}</TableCell>
                    <TableCell>{cliente.telefono}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{formatDate(cliente.fecha_alta)}</TableCell>
                    <TableCell>
                      <Badge className={getEstadoColor(cliente.estado)}>{cliente.estado}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/clientes/${cliente.id}`}>Ver Detalles</Link>
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
