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
import { ClientesFilterForm } from "@/components/clientes-filter-form"
import { REGIONES } from "@/lib/types/regiones"
import { TableStatusSelector } from "@/components/ui/table-status-selector"

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

// Usar cache para evitar múltiples llamadas a la base de datos
const getClientes = cache(async (estado?: string, buscar?: string, regiones?: string | string[]): Promise<Cliente[]> => {
  try {
    const supabase = createServerSupabaseClient()

    let query = supabase
      .from("clientes")
      .select(`
        *,
        planes:plan (
          nombre
        )
      `)
      .order("ip", { ascending: true })

    // Filtrar por estado si se proporciona y no es "todos"
    if (estado && estado !== "todos") {
      query = query.eq("estado", estado.toLowerCase())
    }

    // Buscar por nombre, email o teléfono
    if (buscar) {
      query = query.or(`nombre.ilike.%${buscar}%,email.ilike.%${buscar}%,telefono.ilike.%${buscar}%`)
    }

    // Filtrar por región(es) si se proporciona
    if (regiones && regiones.length > 0) {
      const regionArray = Array.isArray(regiones) ? regiones : [regiones]
      query = query.in("region", regionArray)
    }

    const { data, error } = await query.returns<Cliente[]>()

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

// Nueva función cacheada para obtener regiones únicas
// const getUniqueRegions = cache(async (): Promise<string[]> => {
//   try {
//     const supabase = createServerSupabaseClient()
//     const { data, error } = await supabase
//       .from("clientes")
//       .select("region")
//       .not("region", "is", null) // Solo obtener clientes con una región
//       .distinct("region")

//     if (error) {
//       console.error("Error al obtener regiones:", error)
//       return []
//     }

//     return data.map((item: { region: string }) => item.region).filter(Boolean) as string[]
//   } catch (error) {
//     console.error("Error al obtener regiones:", error)
//     return []
//   }
// })

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { estado?: string; buscar?: string; region?: string | string[] }
}) {
  const selectedRegions = Array.isArray(searchParams.region) ? searchParams.region : (searchParams.region ? [searchParams.region] : [])

  const [clientes] = await Promise.all([
    getClientes(searchParams.estado, searchParams.buscar, selectedRegions),
    // getUniqueRegions(), // Ya no se necesita
  ])

  const uniqueRegions = REGIONES.map(region => region.nombre) // Usar las regiones del archivo

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
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Plan Asignado</TableHead>
                <TableHead>Fecha Alta</TableHead>
                <TableHead>Región</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No se encontraron clientes con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nombre}</TableCell>
                    <TableCell>{cliente.telefono}</TableCell>
                    <TableCell>{cliente.ip}</TableCell>
                    <TableCell>{cliente.planes?.nombre || "No asignado"}</TableCell>
                    <TableCell>{formatDate(cliente.fecha_alta)}</TableCell>
                    <TableCell>{cliente.region || "N/A"}</TableCell>
                    <TableCell>
                      <TableStatusSelector clienteId={cliente.id} estadoActual={cliente.estado} />
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
