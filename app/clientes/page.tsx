"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, getEstadoColor } from "@/lib/utils"
import { Plus, Search, Filter, Eye, Pencil, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClientesFilterForm } from "@/components/clientes-filter-form"
import { REGIONES } from "@/lib/types/regiones"
import { TableStatusSelector } from "@/components/ui/table-status-selector"
import { DeleteClienteButton } from "@/components/delete-cliente-button"
import { ClientesPagination } from "@/components/clientes-pagination"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit, startAfter, getCountFromServer, DocumentData } from "firebase/firestore"
import { Loader2 } from "lucide-react"

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

import { GenerateReceiptsDialog } from "@/components/generate-receipts-dialog"
import { ExportClientesExcelDialog } from "@/components/export-clientes-excel-dialog"

export default function ClientesPage() {
  const searchParams = useSearchParams()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [uniqueRegions, setUniqueRegions] = useState<string[]>([])

  const estado = searchParams.get("estado") || "activo"
  const buscar = searchParams.get("buscar")
  const regiones = searchParams.getAll("region") // Changed from "regiones" to "region"
  const page = Number(searchParams.get("page")) || 1
  const pageSize = 20

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        console.log("[CLIENTES] Starting fetch...")

        // 1. Fetch Planes for manual join
        const planesSnapshot = await getDocs(collection(db, "planes"))
        const planesMap = new Map<string, string>()
        planesSnapshot.forEach(doc => {
          const data = doc.data()
          planesMap.set(doc.id, data.nombre)
        })
        console.log("[CLIENTES] Loaded", planesMap.size, "planes")

        // 2. Build Query - simplified without orderBy to avoid index issues
        const clientesRef = collection(db, "clientes")
        const constraints = []

        // Apply filters
        if (estado && estado !== "todos") {
          constraints.push(where("estado", "==", estado.toLowerCase()))
        }

        if (regiones && regiones.length > 0) {
          const regionArray = Array.isArray(regiones) ? regiones : [regiones]
          // 'in' query supports up to 10
          if (regionArray.length > 0 && regionArray.length <= 10) {
            constraints.push(where("region", "in", regionArray))
          }
        }

        // Build query
        let finalQuery = constraints.length > 0
          ? query(clientesRef, ...constraints)
          : query(clientesRef)

        console.log("[CLIENTES] Executing query with", constraints.length, "constraints")
        const snapshot = await getDocs(finalQuery)
        console.log("[CLIENTES] Got", snapshot.docs.length, "documents")

        // Map data
        let results = snapshot.docs.map(doc => {
          const data = doc.data() as any
          return {
            ...data,
            id: doc.id,
            planes: {
              nombre: data.plan ? (planesMap.get(data.plan) || "Desconocido") : "Sin Plan"
            }
          } as Cliente
        })

        // Client-side filtering for 'buscar'
        if (buscar) {
          const searchLower = buscar.toLowerCase()
          results = results.filter(c =>
            c.nombre?.toLowerCase().includes(searchLower) ||
            c.email?.toLowerCase().includes(searchLower) ||
            c.telefono?.includes(searchLower) ||
            c.ip?.includes(searchLower)
          )
        }

        // Sort by IP client-side (since we can't use orderBy reliably)
        results.sort((a, b) => {
          const ipA = parseInt(a.ip) || 0
          const ipB = parseInt(b.ip) || 0
          return ipA - ipB
        })

        setTotal(results.length)

        // Manual Pagination (Slice)
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedResults = results.slice(startIndex, endIndex)

        console.log("[CLIENTES] Showing", paginatedResults.length, "of", results.length, "total")
        setClientes(paginatedResults)
        console.log("[CLIENTES] State updated, clientes array length:", paginatedResults.length)

        // Use REGIONES constant instead of scanning DB
        setUniqueRegions(REGIONES.map(r => r.nombre))

      } catch (error) {
        console.error("[CLIENTES] Error fetching clientes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [estado, buscar, JSON.stringify(regiones), page]) // Removed pageSize and searchParams to avoid infinite loops

  console.log("[CLIENTES] Render - loading:", loading, "clientes count:", clientes.length)

  const totalPages = Math.ceil(total / pageSize)

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <ExportClientesExcelDialog filters={{ estado, buscar, regiones }} />
          <GenerateReceiptsDialog />
          <Button asChild>
            <Link href="/clientes/nuevo">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Link>
          </Button>
        </div>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                  </TableCell>
                </TableRow>
              ) : clientes.length === 0 ? (
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
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/clientes/${cliente.id}/editar`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/public/pagos/${cliente.id}`} target="_blank" rel="noopener noreferrer">
                            <Clock className="h-4 w-4" />
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
