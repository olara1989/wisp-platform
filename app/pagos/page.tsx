import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cache } from "react"

const MESES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Usar cache para evitar múltiples llamadas a la base de datos
const getPagos = cache(async (metodo?: string, buscar?: string, desde?: string, hasta?: string, page: number = 1, pageSize: number = 20) => {
  try {
    const supabase = createServerSupabaseClient()

    let query = supabase
      .from("pagos")
      .select(`
        *,
        clientes:cliente_id (
          id,
          nombre,
          telefono,
          email
        )
      `)
      .order("fecha_pago", { ascending: false })

    // Filtrar por método de pago
    if (metodo && metodo !== "todos") {
      query = query.eq("metodo", metodo)
    }

    // Filtrar por fecha desde
    if (desde) {
      query = query.gte("fecha_pago", desde)
    }

    // Filtrar por fecha hasta
    if (hasta) {
      query = query.lte("fecha_pago", hasta)
    }

    // Buscar por referencia o notas
    if (buscar) {
      query = query.or(`referencia.ilike.%${buscar}%,notas.ilike.%${buscar}%`)
    }

    // Obtener el total de pagos para paginación
    const countQuery = supabase
      .from("pagos")
      .select("id", { count: "exact", head: true })
    if (metodo && metodo !== "todos") countQuery.eq("metodo", metodo)
    if (desde) countQuery.gte("fecha_pago", desde)
    if (hasta) countQuery.lte("fecha_pago", hasta)
    if (buscar) countQuery.or(`referencia.ilike.%${buscar}%,notas.ilike.%${buscar}%`)
    const { count } = await countQuery

    // Paginación
    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener pagos:", error)
      return { data: [], total: 0 }
    }
    return { data: data || [], total: count || 0 }
  } catch (error) {
    console.error("Error al obtener pagos:", error)
    return { data: [], total: 0 }
  }
})

export default async function PagosPage({
  searchParams,
}: {
  searchParams: { metodo?: string; buscar?: string; desde?: string; hasta?: string; page?: string }
}) {
  const page = Number(searchParams.page) || 1
  const pageSize = 20
  const { data: pagos, total } = await getPagos(searchParams.metodo, searchParams.buscar, searchParams.desde, searchParams.hasta, page, pageSize)
  const totalPages = Math.ceil(total / pageSize)
  // Calcular la suma total de los montos filtrados
  const { data: allPagos } = await getPagos(searchParams.metodo, searchParams.buscar, searchParams.desde, searchParams.hasta, 1, 10000)
  const totalMonto = (allPagos || []).reduce((sum: number, pago: any) => sum + (Number(pago.monto) || 0), 0)

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Pagos</h1>
          <span className="text-lg font-semibold text-[#009EC3]">Total: {formatCurrency(totalMonto)}</span>
        </div>
        <Button asChild>
          <Link href="/pagos/nuevo">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Pago
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra la lista de pagos por método, fecha o busca por referencia</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select name="metodo" defaultValue={searchParams.metodo || "todos"}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="deposito">Depósito</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Desde:</span>
              <Input type="date" name="desde" defaultValue={searchParams.desde || ""} className="w-[180px]" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Hasta:</span>
              <Input type="date" name="hasta" defaultValue={searchParams.hasta || ""} className="w-[180px]" />
            </div>

            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                name="buscar"
                placeholder="Buscar por referencia o notas"
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
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No se encontraron pagos con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                pagos.map((pago: any) => (
                  <TableRow key={pago.id}>
                    <TableCell>{formatDate(pago.fecha_pago)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{pago.clientes?.nombre}</div>
                      <div className="text-xs text-muted-foreground">{pago.clientes?.telefono}</div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(pago.monto)}</TableCell>
                    <TableCell>{pago.metodo}</TableCell>
                    <TableCell>{MESES[Number(pago.mes)]}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/clientes/${pago.cliente_id}`}>Ver Cliente</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginación */}
      <div className="flex justify-center my-6">
        <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <Link
              key={i + 1}
              href={{
                pathname: "/pagos",
                query: { ...searchParams, page: i + 1 },
              }}
              className={`px-3 py-1 border border-gray-300 text-sm font-medium ${page === i + 1 ? "bg-primary text-white" : "bg-white text-gray-700"}`}
              aria-current={page === i + 1 ? "page" : undefined}
            >
              {i + 1}
            </Link>
          ))}
        </nav>
      </div>
    </DashboardLayout>
  )
}
