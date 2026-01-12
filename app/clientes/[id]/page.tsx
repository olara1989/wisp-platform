"use client"

import Link from "next/link"
import { notFound, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate, getEstadoColor, getEstadoPagoColor } from "@/lib/utils"
import { Edit, MapPin, Phone, Mail, ArrowLeft, Wifi, Plus, Globe, DollarSign, Calendar, Loader2 } from "lucide-react"
import { ClientMapWrapper } from "@/components/client-map-wrapper"
import { StatusSelector } from "@/components/ui/status-selector"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore"

// Definiciones de tipos para los datos
interface Cliente {
  id: string
  nombre: string
  telefono: string
  email: string | null
  direccion: string | null
  latitud: number | null
  longitud: number | null
  ip: string
  region: string
  plan: string
  estado: string
  fecha_alta: any // Timestamp or string
  notas: string | null
  plan_details?: Plan | null
  antena?: string | null;
  db?: number | null;
  prestada?: boolean;
}

interface Plan {
  id: string
  nombre: string
  precio: number
  subida: number
  bajada: number
  burst_subida: number | null
  burst_bajada: number | null
  tiempo_burst: number | null
}

interface Router {
  id: string
  nombre: string
  ip: string
}

interface Dispositivo {
  id: string
  cliente_id: string
  ip: string
  mac: string
  interface: string
  router_id: string
  modo_control: string
  routers: Router | null
}

interface Factura {
  id: string
  cliente_id: string
  plan_id: string
  periodo_inicio: any
  periodo_fin: any
  estado_pago: string
  fecha_corte: any
  planes: Plan
}

interface Pago {
  id: string
  cliente_id: string
  fecha_pago: any
  monto: number
  metodo: string
  referencia: string | null
  notas: string | null
  mes: string | number
}

// const MESES = [ ... ] defined below to avoid duplication issues if global
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

export default function ClienteDetallePage() {
  const params = useParams()
  const id = params?.id as string

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    cliente: Cliente | null,
    dispositivos: Dispositivo[],
    facturacion: Factura[],
    pagos: Pago[]
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setLoading(true)
      try {
        // 1. Fetch Cliente
        const clienteRef = doc(db, "clientes", id)
        const clienteSnap = await getDoc(clienteRef)

        if (!clienteSnap.exists()) {
          setData(null)
          setLoading(false)
          return
        }
        const clienteData = { id: clienteSnap.id, ...clienteSnap.data() } as Cliente

        // 2. Fetch Plan del cliente
        let planDetails = null
        if (clienteData.plan) {
          const planSnap = await getDoc(doc(db, "planes", clienteData.plan))
          if (planSnap.exists()) {
            planDetails = { id: planSnap.id, ...planSnap.data() } as Plan
          }
        }
        clienteData.plan_details = planDetails

        // 3. Fetch Dispositivos
        const qDis = query(collection(db, "dispositivos"), where("cliente_id", "==", id))
        const disSnap = await getDocs(qDis)
        const dispositivos: Dispositivo[] = []

        for (const d of disSnap.docs) {
          const disData = { id: d.id, ...d.data() } as any
          // Fetch Router for each device
          let routerData = null
          if (disData.router_id) {
            const rSnap = await getDoc(doc(db, "routers", disData.router_id))
            if (rSnap.exists()) {
              routerData = { id: rSnap.id, ...rSnap.data() }
            }
          }
          disData.routers = routerData
          dispositivos.push(disData)
        }

        // 4. Fetch Facturacion
        // Firestore filtering does not support simple joins. We fetch by client_id.
        const qFact = query(collection(db, "facturacion"), where("cliente_id", "==", id), orderBy("periodo_inicio", "desc"))
        // Note: orderBy requires an index if combined with where. If it fails, remove orderBy.
        // Assuming dev environment we might see error or it works if index exists. Use simple query first if unsure.
        // We'll try with orderBy, catch error.
        let factSnap
        try {
          factSnap = await getDocs(qFact)
        } catch (e) {
          // Fallback without sort if index missing
          const qFactSimple = query(collection(db, "facturacion"), where("cliente_id", "==", id))
          factSnap = await getDocs(qFactSimple)
          // Sort manually? Too complex for now, just load.
        }

        const facturacion: Factura[] = []
        for (const f of factSnap.docs) {
          const factData = { id: f.id, ...f.data() } as any
          // Fetch Plan for invoice
          let planFact = null
          if (factData.plan_id) {
            const pSnap = await getDoc(doc(db, "planes", factData.plan_id))
            if (pSnap.exists()) {
              planFact = { id: pSnap.id, ...pSnap.data() }
            }
          }
          factData.planes = planFact || { nombre: "Desconocido", precio: 0 } // Fallback
          facturacion.push(factData)
        }

        // 5. Fetch Pagos
        const qPagos = query(collection(db, "pagos"), where("cliente_id", "==", id), orderBy("fecha_pago", "desc"))
        let pagosSnap
        try {
          pagosSnap = await getDocs(qPagos)
        } catch (e) {
          const qPagosSimple = query(collection(db, "pagos"), where("cliente_id", "==", id))
          pagosSnap = await getDocs(qPagosSimple)
        }
        const pagos = pagosSnap.docs.map(p => ({ id: p.id, ...p.data() } as Pago))

        // Ordenar pagos en memoria para asegurar el orden (lo mas reciente primero)
        // Esto es útil si falla el orderBy de Firestore por falta de índices
        pagos.sort((a, b) => {
          const getSeconds = (date: any) => {
            if (!date) return 0;
            if (date.seconds) return date.seconds;
            if (date instanceof Date) return date.getTime() / 1000;
            return new Date(date).getTime() / 1000;
          }
          return getSeconds(b.fecha_pago) - getSeconds(a.fecha_pago);
        })

        setData({ cliente: clienteData, dispositivos, facturacion, pagos })

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>
      </DashboardLayout>
    )
  }

  if (!data || !data.cliente) {
    return (
      <DashboardLayout>
        <div>Cliente no encontrado</div>
      </DashboardLayout>
    )
  }

  const { cliente, dispositivos, facturacion, pagos } = data
  const facturaActual = facturacion[0]

  // Helper to safely format dates which might be timestamps
  const safeFormatDate = (val: any) => {
    if (!val) return "";
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString();
    if (val instanceof Date) return val.toLocaleDateString();
    return val;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Encabezado/tarjeta de perfil */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 flex items-center">
          <Button variant="outline" size="icon" asChild className="mr-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
            <Link href="/clientes">
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400 inline" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{cliente.nombre}</h1>
          <div className="ml-4">
            <StatusSelector clienteId={cliente.id} estadoActual={cliente.estado} />
          </div>
          <div className="ml-auto">
            <Button asChild className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
              <Link href={`/clientes/${cliente.id}/editar`}>
                <Edit className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400 inline" /> Editar
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-200">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-0">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-0">
              <div className="space-y-0">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 mr-2 inline text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-200">Email:</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{cliente.email || "No especificado"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 mr-2 inline text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-200">Teléfono:</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{cliente.telefono}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 mr-2 inline text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-200">Dirección:</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{cliente.direccion || "No especificada"}</span>
                </div>
              </div>

              {/* Sección: Detalles de Conexión */}
              <div className="space-y-0 mt-6">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">Detalles de Conexión</h3>
                <div className="grid grid-cols-1 gap-0">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 mr-2 inline text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">IP:</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{cliente.ip}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 mr-2 inline text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">Plan Asignado:</span>
                    </div>
                    {cliente.plan_details ? (
                      <span className="text-sm text-muted-foreground">
                        {cliente.plan_details.nombre} - {formatCurrency(cliente.plan_details.precio)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No hay plan asignado directamente.</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 mr-2 inline text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">Activo desde:</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{safeFormatDate(cliente.fecha_alta)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 mr-2 inline text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">Región:</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{cliente.region || "No especificada"}</span>
                  </div>
                </div>
              </div>

              {/* Sección: Información de Antena */}
              <div className="space-y-0 mt-6">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">Información de Antena</h3>
                <div className="grid grid-cols-1 gap-0">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-5 w-5 mr-2 inline text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">Tipo de Antena:</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{cliente.antena || "No especificada"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 mr-2 inline text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">Valor DB:</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{cliente.db !== null ? cliente.db : "No especificado"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 mr-2 inline text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">Estado Antena:</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {typeof cliente.prestada === 'boolean' ? (cliente.prestada ? "Prestada" : "Propia") : "No especificado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección: Notas */}
              {cliente.notas && (
                <div className="space-y-0 mt-6">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">Notas Adicionales</h3>
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-muted-foreground whitespace-pre-line">{cliente.notas}</span>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-200">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-0">Ubicación del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ClientMapWrapper initialLat={cliente.latitud} initialLng={cliente.longitud} />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dispositivos">
          <TabsList>
            <TabsTrigger value="dispositivos">Dispositivos</TabsTrigger>
            <TabsTrigger value="pagos">Historial de Pagos</TabsTrigger>
            <TabsTrigger value="facturacion">Historial de Facturación</TabsTrigger>
          </TabsList>

          <TabsContent value="dispositivos" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Dispositivos</CardTitle>
                <Button asChild>
                  <Link href={`/dispositivos/nuevo?cliente=${cliente.id}`}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Dispositivo
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {dispositivos.length === 0 ? (
                  <div className="text-center py-6">
                    <Wifi className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No hay dispositivos registrados para este cliente</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP</TableHead>
                        <TableHead>MAC</TableHead>
                        <TableHead>Interface</TableHead>
                        <TableHead>Router</TableHead>
                        <TableHead>Modo Control</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispositivos.map((dispositivo) => (
                        <TableRow key={dispositivo.id}>
                          <TableCell>{dispositivo.ip}</TableCell>
                          <TableCell>{dispositivo.mac}</TableCell>
                          <TableCell>{dispositivo.interface}</TableCell>
                          <TableCell>{dispositivo.routers?.nombre}</TableCell>
                          <TableCell>{dispositivo.modo_control}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dispositivos/${dispositivo.id}/editar`}>Editar</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagos" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Historial de Pagos</CardTitle>
                <Button asChild>
                  <Link href={`/pagos/nuevo?cliente=${cliente.id}`}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Pago
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {pagos.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No hay pagos registrados para este cliente</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Mes</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagos.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell>{safeFormatDate(pago.fecha_pago)}</TableCell>
                          <TableCell>{formatCurrency(pago.monto)}</TableCell>
                          <TableCell>{pago.metodo}</TableCell>
                          <TableCell>{MESES[Number(pago.mes)]}</TableCell>
                          <TableCell>{pago.notas}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facturacion" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Facturación</CardTitle>
              </CardHeader>
              <CardContent>
                {facturacion.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No hay registros de facturación para este cliente</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha Corte</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturacion.map((factura) => (
                        <TableRow key={factura.id}>
                          <TableCell>
                            {safeFormatDate(factura.periodo_inicio)} - {safeFormatDate(factura.periodo_fin)}
                          </TableCell>
                          <TableCell>{factura.planes.nombre}</TableCell>
                          <TableCell>{formatCurrency(factura.planes.precio)}</TableCell>
                          <TableCell>
                            <Badge className={getEstadoPagoColor(factura.estado_pago)}>{factura.estado_pago}</Badge>
                          </TableCell>
                          <TableCell>{safeFormatDate(factura.fecha_corte)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
