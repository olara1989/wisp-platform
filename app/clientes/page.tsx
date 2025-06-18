import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createServerSupabaseClient } from "@/lib/supabase"
import { formatDate, getEstadoColor } from "@/lib/utils"
import { Plus, Search, Filter, Eye, Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cache } from "react"
import { ClientesFilterForm } from "@/components/clientes-filter-form"
import { REGIONES } from "@/lib/types/regiones"
import { TableStatusSelector } from "@/components/ui/table-status-selector"
import { DeleteClienteButton } from "@/components/delete-cliente-button"
import { ClientesPagination } from "@/components/clientes-pagination"

interface Cliente {
  id: string
  nombre: string
  telefono: string
  email: string | null
  direccion: string | null
  latitud: number | null
  longitud: number | null
  ip: string
  region: string | null
  plan: string | null
  estado: string
  fecha_alta: string
  notas: string | null
  planes: {
    nombre: string
  } | null
}

const getClientes = cache(async (
  estado?: string, 
  buscar?: string, 
  regiones?: string | string[],
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: Cliente[], total: number }> => {
  try {
    const supabase = createServerSupabaseClient()

    // Primero obtenemos el total de registros
    let countQuery = supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })

    // Aplicamos los mismos filtros al conteo
    if (estado && estado !== "todos") {
      countQuery = countQuery.eq("estado", estado.toLowerCase())
    }
    if (buscar) {
      countQuery = countQuery.or(`nombre.ilike.%${buscar}%,email.ilike.%${buscar}%,telefono.ilike.%${buscar}%`)
    }
    if (regiones && regiones.length > 0) {
      const regionArray = Array.isArray(regiones) ? regiones : [regiones]
      countQuery = countQuery.in("region", regionArray)
    }

    const { count } = await countQuery

    // Luego obtenemos los datos paginados
    let query = supabase
      .from("clientes")
      .select(`
        *,
        planes:plan (
          nombre
        )
      `)
      .order("ip", { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (estado && estado !== "todos") {
      query = query.eq("estado", estado.toLowerCase())
    }
    if (buscar) {
      query = query.or(`nombre.ilike.%${buscar}%,email.ilike.%${buscar}%,telefono.ilike.%${buscar}%`)
    }
    if (regiones && regiones.length > 0) {
      const regionArray = Array.isArray(regiones) ? regiones : [regiones]
      query = query.in("region", regionArray)
    }

    const { data, error } = await query.returns<Cliente[]>()

    if (error) {
      console.error("Error al obtener clientes:", error)
      return { data: [], total: 0 }
    }

    return { data: data || [], total: count || 0 }
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    return { data: [], total: 0 }
  }
})

// Nueva función cacheada para obtener regiones únicas
const getUniqueRegions = cache(async (): Promise<string[]> => {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("clientes")
      .select("region")
      .not("region", "is", null)
      .order("region")

    if (error) {
      console.error("Error al obtener regiones:", error)
      return []
    }

    // Obtener regiones únicas usando Set
    const uniqueRegions = Array.from(new Set(data.map(item => item.region).filter(Boolean)))
    return uniqueRegions as string[]
  } catch (error) {
    console.error("Error al obtener regiones:", error)
    return []
  }
})

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const estado = searchParams.estado as string
  const buscar = searchParams.buscar as string
  const regiones = searchParams.regiones
  const page = Number(searchParams.page) || 1
  const pageSize = 20

  const { data: clientes, total } = await getClientes(estado, buscar, regiones, page, pageSize)
  const uniqueRegions = await getUniqueRegions()

  const totalPages = Math.ceil(total / pageSize)

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
          <ClientesFilterForm uniqueRegions={uniqueRegions} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Región</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No se encontraron clientes con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>{cliente.ip}</TableCell>
                    <TableCell>{cliente.nombre}</TableCell>
                    <TableCell>{cliente.region}</TableCell>
                    <TableCell>{cliente.telefono}</TableCell>
                    <TableCell>{cliente.planes?.nombre}</TableCell>
                    <TableCell>
                      <TableStatusSelector
                        clienteId={cliente.id}
                        estadoActual={cliente.estado}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/clientes/${cliente.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClientesPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
      />
    </DashboardLayout>
  )
}
