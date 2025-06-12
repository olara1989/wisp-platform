import Link from "next/link"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createServerSupabaseClient } from "@/lib/supabase"
import { formatCurrency, formatDate, getEstadoColor, getEstadoPagoColor } from "@/lib/utils"
import { Edit, MapPin, Phone, Mail, ArrowLeft, Wifi, Plus, Globe, DollarSign, Calendar } from "lucide-react"
import { ClientMapWrapper } from "@/components/client-map-wrapper"

// Definiciones de tipos para los datos de Supabase
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
  fecha_alta: string
  notas: string | null
  plan_details?: Plan | null // Detalles completos del plan asignado
  antena?: string | null; // Nuevo campo
  db?: number | null; // Nuevo campo
  prestada?: boolean; // Nuevo campo
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
  routers: Router | null // Relación con la tabla routers
}

interface Factura {
  id: string
  cliente_id: string
  plan_id: string
  periodo_inicio: string
  periodo_fin: string
  estado_pago: string
  fecha_corte: string
  planes: Plan // Relación con la tabla planes
}

interface Pago {
  id: string
  cliente_id: string
  fecha_pago: string
  monto: number
  metodo: string
  referencia: string | null
  notas: string | null
}

// Importación dinámica del componente de mapa para evitar problemas de SSR
// const DynamicGoogleMapInput = dynamic(() => import("@/components/ui/google-map-input").then((mod) => mod.GoogleMapInput), {
//   ssr: false,
//   loading: () => <p>Cargando mapa...</p>,
// })

async function getClienteData(id: string) {
  const supabase = createServerSupabaseClient()

  // Obtener datos del cliente
  const { data: cliente, error } = await supabase.from("clientes").select("*").eq("id", id).single<Cliente>()

  if (error || !cliente) {
    return null
  }

  // Obtener detalles del plan asignado al cliente
  let assignedPlan: Plan | null = null;
  if (cliente.plan) { // Asumiendo que cliente.plan guarda el ID del plan
    const { data: planData, error: planError } = await supabase
      .from("planes")
      .select("id, nombre, precio")
      .eq("id", cliente.plan)
      .single<Plan>();

    if (planData && !planError) {
      assignedPlan = planData;
    } else if (planError) {
      console.error("Error al obtener el plan asignado:", planError);
    }
  }
  cliente.plan_details = assignedPlan; // Asignar el plan al cliente

  // Obtener dispositivos del cliente
  const { data: dispositivos } = await supabase
    .from("dispositivos")
    .select(`
      *,
      routers:router_id (
        id,
        nombre,
        ip
      )
    `)
    .eq("cliente_id", id)
    .returns<Dispositivo[]>()

  // Obtener facturación del cliente
  const { data: facturacion } = await supabase
    .from("facturacion")
    .select(`
      *,
      planes:plan_id (
        id,
        nombre,
        precio,
        subida,
        bajada,
        burst_subida,
        burst_bajada,
        tiempo_burst
      )
    `)
    .eq("cliente_id", id)
    .order("periodo_inicio", { ascending: false })
    .returns<Factura[]>()

  // Obtener pagos del cliente
  const { data: pagos } = await supabase
    .from("pagos")
    .select("*")
    .eq("cliente_id", id)
    .order("fecha_pago", { ascending: false })
    .returns<Pago[]>()

  return {
    cliente,
    dispositivos: dispositivos || [],
    facturacion: facturacion || [],
    pagos: pagos || [],
  }
}

export default async function ClienteDetallePage({
  params,
}: {
  params: { id: string }
}) {
  const data = await getClienteData(params.id)

  if (!data) {
    notFound()
  }

  const { cliente, dispositivos, facturacion, pagos } = data
  const facturaActual = facturacion[0]

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
          <Badge className={getEstadoColor(cliente.estado) + " ml-4 px-2 py-1 text-sm font-medium rounded"}>{cliente.estado}</Badge>
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
            <CardHeader className="p-0 pb-4"> {/* Eliminar padding duplicado */}
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-0">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-0"> {/* Eliminar padding duplicado y manejar espaciado con las filas */}
              {/* Sección: Información Básica */}
              <div className="space-y-0">
                {/* Eliminar div space-y-4 aquí */}
                {/* Reorganizar items para usar flex justify-between items-center py-2 border-b */} 
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
              <div className="space-y-0 mt-6"> {/* Añadir margen superior para separar secciones */}
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
                    <span className="text-sm text-muted-foreground">{formatDate(cliente.fecha_alta)}</span>
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
              <div className="space-y-0 mt-6"> {/* Añadir margen superior para separar secciones */}
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
              {/* Se eliminó la dirección de aquí */}
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
                        <TableHead>Referencia</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagos.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell>{formatDate(pago.fecha_pago)}</TableCell>
                          <TableCell>{formatCurrency(pago.monto)}</TableCell>
                          <TableCell>{pago.metodo}</TableCell>
                          <TableCell>{pago.referencia}</TableCell>
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
                            {formatDate(factura.periodo_inicio)} - {formatDate(factura.periodo_fin)}
                          </TableCell>
                          <TableCell>{factura.planes.nombre}</TableCell>
                          <TableCell>{formatCurrency(factura.planes.precio)}</TableCell>
                          <TableCell>
                            <Badge className={getEstadoPagoColor(factura.estado_pago)}>{factura.estado_pago}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(factura.fecha_corte)}</TableCell>
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
