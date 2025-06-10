"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase"
import { suspenderCliente } from "@/lib/mikrotik"
import { formatCurrency, formatDate, getEstadoPagoColor } from "@/lib/utils"
import { ArrowLeft, AlertTriangle, WifiOff, Loader2 } from "lucide-react"

export default function SuspenderClientePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const facturaId = searchParams.get("factura")
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSuspending, setIsSuspending] = useState(false)
  const [factura, setFactura] = useState<any>(null)
  const [cliente, setCliente] = useState<any>(null)
  const [dispositivo, setDispositivo] = useState<any>(null)
  const [routerData, setRouterData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!facturaId) {
        toast({
          title: "Error",
          description: "ID de factura no proporcionado",
          variant: "destructive",
        })
        return
      }

      try {
        const supabase = createClientSupabaseClient()

        // Obtener factura
        const { data: facturaData, error: facturaError } = await supabase
          .from("facturacion")
          .select(`
            *,
            clientes:cliente_id (*),
            planes:plan_id (*)
          `)
          .eq("id", facturaId)
          .single()

        if (facturaError || !facturaData) {
          throw new Error("Factura no encontrada")
        }

        setFactura(facturaData)
        setCliente(facturaData.clientes)

        // Obtener dispositivo del cliente
        const { data: dispositivoData, error: dispositivoError } = await supabase
          .from("dispositivos")
          .select(`
            *,
            routers:router_id (*)
          `)
          .eq("cliente_id", facturaData.cliente_id)
          .single()

        if (!dispositivoError && dispositivoData) {
          setDispositivo(dispositivoData)
          setRouterData(dispositivoData.routers)
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al cargar los datos",
          variant: "destructive",
        })
        router.push("/cortes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [facturaId, toast, router])

  const handleSuspender = async () => {
    if (!dispositivo || !routerData) {
      toast({
        title: "Error",
        description: "No se encontró dispositivo o router asociado al cliente",
        variant: "destructive",
      })
      return
    }

    setIsSuspending(true)

    try {
      // Suspender cliente en Mikrotik
      await suspenderCliente(routerData.id, dispositivo.ip, routerData.modo_control)

      // Actualizar estado del cliente a suspendido
      const supabase = createClientSupabaseClient()
      await supabase.from("clientes").update({ estado: "suspendido" }).eq("id", cliente.id)

      toast({
        title: "Cliente suspendido",
        description: "El servicio del cliente ha sido suspendido exitosamente",
      })

      router.push("/cortes")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al suspender el cliente",
        variant: "destructive",
      })
    } finally {
      setIsSuspending(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/cortes">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Suspender Cliente</h1>
      </div>

      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Advertencia</AlertTitle>
        <AlertDescription>
          Está a punto de suspender el servicio de internet del cliente. Esta acción deshabilitará su conexión.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-lg">{cliente?.nombre}</p>
              <p className="text-sm text-muted-foreground">{cliente?.telefono}</p>
              <p className="text-sm text-muted-foreground">{cliente?.email}</p>
            </div>

            <div>
              <p className="font-medium">Dirección</p>
              <p className="text-sm text-muted-foreground">{cliente?.direccion}</p>
            </div>

            <div>
              <p className="font-medium">Estado Actual</p>
              <Badge
                className={
                  cliente?.estado === "suspendido" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                }
              >
                {cliente?.estado === "suspendido" ? "Suspendido" : "Moroso"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de Facturación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Plan</p>
                <p className="text-sm text-muted-foreground">{factura?.planes.nombre}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{formatCurrency(factura?.planes.precio)}</p>
                <Badge className={getEstadoPagoColor(factura?.estado_pago)}>{factura?.estado_pago}</Badge>
              </div>
            </div>

            <div>
              <p className="font-medium">Período</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(factura?.periodo_inicio)} - {formatDate(factura?.periodo_fin)}
              </p>
            </div>

            <div>
              <p className="font-medium">Fecha de Corte</p>
              <p className="text-sm text-muted-foreground">{formatDate(factura?.fecha_corte)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Dispositivo y Router</CardTitle>
          <CardDescription>Información del dispositivo que será suspendido</CardDescription>
        </CardHeader>
        <CardContent>
          {!dispositivo || !routerData ? (
            <div className="text-center py-6">
              <WifiOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No se encontró dispositivo o router asociado al cliente</p>
              <Button className="mt-4" asChild>
                <Link href={`/dispositivos/nuevo?cliente=${cliente?.id}`}>Agregar Dispositivo</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Dispositivo</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">IP:</span>
                    <span className="text-sm font-medium">{dispositivo.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">MAC:</span>
                    <span className="text-sm font-medium">{dispositivo.mac}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Interface:</span>
                    <span className="text-sm font-medium">{dispositivo.interface}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Modo Control:</span>
                    <span className="text-sm font-medium">{dispositivo.modo_control}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Router</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nombre:</span>
                    <span className="text-sm font-medium">{routerData.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">IP:</span>
                    <span className="text-sm font-medium">{routerData.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Puerto API:</span>
                    <span className="text-sm font-medium">{routerData.puerto_api}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Modo Control:</span>
                    <span className="text-sm font-medium">{routerData.modo_control}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/cortes">Cancelar</Link>
          </Button>
          <Button
            variant="destructive"
            onClick={handleSuspender}
            disabled={isSuspending || !dispositivo || !routerData || cliente?.estado === "suspendido"}
          >
            {isSuspending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suspendiendo...
              </>
            ) : cliente?.estado === "suspendido" ? (
              <>
                <WifiOff className="mr-2 h-4 w-4" />
                Ya Suspendido
              </>
            ) : (
              <>
                <WifiOff className="mr-2 h-4 w-4" />
                Suspender Servicio
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </DashboardLayout>
  )
}
