"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Search, Filter, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, getDocs, orderBy, query, limit, where, getDoc, doc } from "firebase/firestore"
import { DeletePagoButton } from "@/components/delete-pago-button"

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

interface Pago {
  id: string
  cliente_id: string
  fecha_pago: any
  monto: number
  metodo: string
  mes: string | number // Assuming string/number mixed in migration
  anio?: string | number
  clientes?: any
}

export default function PagosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter Params
  const metodoParam = searchParams.get("metodo") || "todos"
  const buscarParam = searchParams.get("buscar") || ""
  const desdeParam = searchParams.get("desde") || ""
  const hastaParam = searchParams.get("hasta") || ""
  const pageParam = Number(searchParams.get("page")) || 1

  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [totalMonto, setTotalMonto] = useState(0)

  // Pagination (Client Side for simplicity with manual joins/filters)
  const pageSize = 20
  const [totalPages, setTotalPages] = useState(0)
  const [paginatedPagos, setPaginatedPagos] = useState<Pago[]>([])

  useEffect(() => {
    const fetchPagos = async () => {
      setLoading(true)
      try {
        let q = query(collection(db, "pagos"), orderBy("fecha_pago", "desc"))

        // Firestore doesn't allow multiple OrderBy with Inequality filters on different fields easily without index.
        // We will fetch all and filter in memory if dataset is small (< few thousands).
        // If large, we need compound indexes. Assuming moderate size for migration.

        // Optimized Query for Date Range if provided
        if (desdeParam) {
          q = query(q, where("fecha_pago", ">=", desdeParam))
        }
        if (hastaParam) {
          q = query(q, where("fecha_pago", "<=", hastaParam))
        }
        if (metodoParam && metodoParam !== "todos") {
          q = query(q, where("metodo", "==", metodoParam))
        }

        const snapshot = await getDocs(q)

        // Process and Manual Join
        // We need to fetch clients for display.
        // Optimize: Collect unique client IDs and fetch them in parallel or one by one.
        // Or fetch all clients once.

        // Just map first
        let rawPagos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Pago))

        // Memory Filter for Search (reference or notes)
        if (buscarParam) {
          const term = buscarParam.toLowerCase()
          rawPagos = rawPagos.filter((p: any) =>
            (p.referencia && p.referencia.toLowerCase().includes(term)) ||
            (p.notas && p.notas.toLowerCase().includes(term))
          )
        }

        // Calculate Total Monto BEFORE Pagination
        const total = rawPagos.reduce((sum, p) => sum + (Number(p.monto) || 0), 0)
        setTotalMonto(total)

        // Pagination Logic
        const totalCount = rawPagos.length
        setTotalPages(Math.ceil(totalCount / pageSize))

        const start = (pageParam - 1) * pageSize
        const end = start + pageSize
        const slicedPagos = rawPagos.slice(start, end)

        // Join with Clients for Valid Sliced Items
        // Fetching only needed clients
        const pagosWithClients = await Promise.all(slicedPagos.map(async (p) => {
          if (p.cliente_id) {
            const clientRef = doc(db, "clientes", p.cliente_id)
            const clientSnap = await getDoc(clientRef)
            if (clientSnap.exists()) {
              return { ...p, clientes: clientSnap.data() }
            }
          }
          return { ...p, clientes: { nombre: "Desconocido", telefono: "" } }
        }))

        setPagos(rawPagos) // Store all if needed? Actually we only need paginated ones for display.
        setPaginatedPagos(pagosWithClients)

      } catch (error) {
        console.error("Error fetching pagos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPagos()
  }, [metodoParam, buscarParam, desdeParam, hastaParam, pageParam])

  const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams(searchParams)

    const metodo = formData.get("metodo") as string
    if (metodo) params.set("metodo", metodo)
    else params.delete("metodo")

    const desde = formData.get("desde") as string
    if (desde) params.set("desde", desde)
    else params.delete("desde")

    const hasta = formData.get("hasta") as string
    if (hasta) params.set("hasta", hasta)
    else params.delete("hasta")

    const buscar = formData.get("buscar") as string
    if (buscar) params.set("buscar", buscar)
    else params.delete("buscar")

    params.set("page", "1") // Reset to page 1 on filter
    router.push(`?${params.toString()}`)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>
      </DashboardLayout>
    )
  }

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
          <form className="flex flex-col sm:flex-row gap-4" onSubmit={handleFilter}>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select name="metodo" defaultValue={metodoParam}>
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
              <Input type="date" name="desde" defaultValue={desdeParam} className="w-[180px]" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Hasta:</span>
              <Input type="date" name="hasta" defaultValue={hastaParam} className="w-[180px]" />
            </div>

            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                name="buscar"
                placeholder="Buscar por referencia o notas"
                defaultValue={buscarParam}
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
              {paginatedPagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No se encontraron pagos con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>{formatDate(pago.fecha_pago)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{pago.clientes?.nombre}</div>
                      <div className="text-xs text-muted-foreground">{pago.clientes?.telefono}</div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(pago.monto)}</TableCell>
                    <TableCell>{pago.metodo}</TableCell>
                    <TableCell>{MESES[Number(pago.mes)] || pago.mes} {pago.anio}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/clientes/${pago.cliente_id}`}>Ver Cliente</Link>
                        </Button>
                        <DeletePagoButton pagoId={pago.id} />
                      </div>
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
          {Array.from({ length: totalPages }, (_, i) => {
            return (
              <Button
                key={i + 1}
                variant={pageParam === i + 1 ? "default" : "outline"}
                className="px-3 py-1 mx-1"
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set("page", (i + 1).toString())
                  router.push(`?${params.toString()}`)
                }}
              >
                {i + 1}
              </Button>
            )
          })}
        </nav>
      </div>
    </DashboardLayout>
  )
}
