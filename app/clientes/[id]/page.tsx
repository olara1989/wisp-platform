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
import { Edit, MapPin, Phone, Mail, ArrowLeft, Wifi, Plus } from "lucide-react"

async function getClienteData(id: string) {
  const supabase = createServerSupabaseClient()

  // Obtener datos del cliente
  const { data: cliente, error } = await supabase.from("clientes").select("*").eq("id", id).single()

  if (error || !cliente) {
    return null
  }

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

  // Obtener pagos del cliente
  const { data: pagos } = await supabase
    .from("pagos")
    .select("*")
    .eq("cliente_id", id)
    .order("fecha_pago", { ascending: false })

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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{cliente.nombre}</h1>
          <Badge className={getEstadoColor(cliente.estado)}>{cliente.estado}</Badge>
          <div className="ml-auto">
            <Button asChild>
              <Link href={`/clientes/${cliente.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Teléfono</p>
                  <p className="text-sm text-muted-foreground">{cliente.telefono}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{cliente.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Dirección</p>
                  <p className="text-sm text-muted-foreground">{cliente.direccion}</p>
                  {cliente.latitud && cliente.longitud && (
                    <a
                      href={`https://maps.google.com/?q=${cliente.latitud},${cliente.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Ver en mapa
                    </a>
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium">Fecha de Alta</p>
                <p className="text-sm text-muted-foreground">{formatDate(cliente.fecha_alta)}</p>
              </div>
              {cliente.notas && (
                <div>
                  <p className="font-medium">Notas</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{cliente.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan Actual</CardTitle>
              <CardDescription>Información del plan contratado</CardDescription>
            </CardHeader>
            <CardContent>
              {facturaActual ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-lg">{facturaActual.planes.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {facturaActual.planes.subida}Mbps / {facturaActual.planes.bajada}Mbps
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(facturaActual.planes.precio)}</p>
                      <Badge className={getEstadoPagoColor(facturaActual.estado_pago)}>
                        {facturaActual.estado_pago}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm font-medium">Período</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(facturaActual.periodo_inicio)} - {formatDate(facturaActual.periodo_fin)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Fecha de Corte</p>
                      <p className="text-sm text-muted-foreground">{formatDate(facturaActual.fecha_corte)}</p>
                    </div>
                  </div>

                  {facturaActual.planes.burst_subida && facturaActual.planes.burst_bajada && (
                    <div className="pt-2">
                      <p className="text-sm font-medium">Ráfaga (Burst)</p>
                      <p className="text-sm text-muted-foreground">
                        {facturaActual.planes.burst_subida}Mbps / {facturaActual.planes.burst_bajada}Mbps por{" "}
                        {facturaActual.planes.tiempo_burst} segundos
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/pagos/nuevo?cliente=${cliente.id}`}>Registrar Pago</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Wifi className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Este cliente no tiene un plan asignado</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/facturacion/nuevo?cliente=${cliente.id}`}>Asignar Plan</Link>
                  </Button>
                </div>
              )}
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
