"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase"
import { reactivarCliente } from "@/lib/mikrotik"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Loader2 } from "lucide-react"

// Definir tipos para cliente y facturación
interface Cliente {
  id: string
  nombre: string
  [key: string]: any
}
interface Facturacion {
  id: string
  planes?: { id: string; nombre: string; precio: number } | null
  estado_pago?: string
  [key: string]: any
}

const MESES = [
  { id: 1, nombre: "Enero" },
  { id: 2, nombre: "Febrero" },
  { id: 3, nombre: "Marzo" },
  { id: 4, nombre: "Abril" },
  { id: 5, nombre: "Mayo" },
  { id: 6, nombre: "Junio" },
  { id: 7, nombre: "Julio" },
  { id: 8, nombre: "Agosto" },
  { id: 9, nombre: "Septiembre" },
  { id: 10, nombre: "Octubre" },
  { id: 11, nombre: "Noviembre" },
  { id: 12, nombre: "Diciembre" },
]
const fechaActual = new Date()
const mesActual = fechaActual.getMonth() + 1
const anioActual = fechaActual.getFullYear()
const ANIOS = [anioActual - 1, anioActual, anioActual + 1, anioActual + 2]

export default function NuevoPagoPage() {
  const navigation = useRouter()
  const searchParams = useSearchParams()
  const clienteId = searchParams.get("cliente")
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [facturacion, setFacturacion] = useState<Facturacion | null>(null)
  const [dispositivo, setDispositivo] = useState<any>(null)
  const [routerData, setRouterData] = useState<any>(null)
  const [clienteInput, setClienteInput] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const registrarBtnRef = useRef<HTMLButtonElement>(null)

  const [formData, setFormData] = useState({
    cliente_id: "",
    monto: "",
    metodo: "efectivo",
    referencia: "",
    notas: "",
    fecha_pago: new Date().toISOString().split("T")[0],
    mes: mesActual.toString(),
    anio: anioActual.toString(),
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClientSupabaseClient()
        const { data: clientesData } = await supabase.from("clientes").select("* ").order("nombre")
        setClientes(clientesData as Cliente[] || [])
        if (clienteId) {
          const cliente = (clientesData as Cliente[] | undefined)?.find((c) => c.id === clienteId)
          if (cliente) {
            setFormData((prev) => ({ ...prev, cliente_id: String(cliente.id) }))
            setClienteInput(cliente.nombre)
            await fetchClienteData(cliente.id)
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [clienteId])

  const fetchClienteData = async (id: string) => {
    try {
      const supabase = createClientSupabaseClient()
      const { data: cliente } = await supabase.from("clientes").select("*").eq("id", id).single()
      setClienteSeleccionado(cliente as Cliente)
      // Obtener facturación actual
      const { data: facturacionData } = await supabase
        .from("facturacion")
        .select(`*, planes:plan_id (id, nombre, precio)`)
        .eq("cliente_id", id)
        .order("periodo_inicio", { ascending: false })
        .limit(1)
        .single()
      // Validar que planes sea un objeto y tenga precio
      let planPrecio = ""
      let planNombre = ""
      let planOk = false
      if (
        facturacionData &&
        typeof facturacionData === 'object' &&
        facturacionData.planes &&
        typeof facturacionData.planes === 'object' &&
        'precio' in facturacionData.planes &&
        typeof facturacionData.planes.precio === 'number'
      ) {
        planPrecio = facturacionData.planes.precio.toString()
        planNombre = facturacionData.planes.nombre
        planOk = true
        setFormData((prev) => ({ ...prev, monto: planPrecio }))
        setTimeout(() => {
          registrarBtnRef.current?.focus()
        }, 100)
      }
      setFacturacion(facturacionData && facturacionData.id ? facturacionData as Facturacion : null)
      // Obtener dispositivo y router
      const { data: dispositivoData } = await supabase
        .from("dispositivos")
        .select(`*, routers:router_id (*)`)
        .eq("cliente_id", id)
        .single()
      if (dispositivoData) {
        setDispositivo(dispositivoData)
        setRouterData(dispositivoData.routers)
      }
    } catch (error) {
      console.error("Error al cargar datos del cliente:", error)
    }
  }

  const handleClienteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClienteInput(e.target.value)
    setShowSuggestions(true)
    setFormData((prev) => ({ ...prev, cliente_id: "" }))
    setClienteSeleccionado(null)
    setFacturacion(null)
  }

  const handleClienteSelect = async (cliente: any) => {
    setClienteInput(cliente.nombre)
    setShowSuggestions(false)
    setFormData((prev) => ({ ...prev, cliente_id: String(cliente.id) }))
    await fetchClienteData(cliente.id)
  }

  const handleClienteInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && clienteSeleccionado) {
      registrarBtnRef.current?.focus()
      setShowSuggestions(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMesChange = (value: string) => {
    setFormData((prev) => ({ ...prev, mes: value }))
  }
  const handleAnioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, anio: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const supabase = createClientSupabaseClient()

      // Registrar el pago, incluyendo mes y anio
      const { data: pago, error: pagoError } = await supabase
        .from("pagos")
        .insert({
          ...formData,
          monto: Number.parseFloat(formData.monto),
          mes: formData.mes,
          anio: formData.anio,
        })
        .select()

      if (pagoError) throw pagoError

      // Actualizar estado de facturación
      if (facturacion) {
        await supabase.from("facturacion").update({ estado_pago: "pagado" }).eq("id", facturacion.id)
      }

      // Actualizar estado del cliente si estaba suspendido
      if (clienteSeleccionado?.estado === "suspendido" || clienteSeleccionado?.estado === "moroso") {
        await supabase.from("clientes").update({ estado: "activo" }).eq("id", clienteSeleccionado.id)

        // Reactivar servicio en Mikrotik si el cliente estaba suspendido
        if (clienteSeleccionado?.estado === "suspendido" && dispositivo && routerData) {
          try {
            await reactivarCliente(routerData.id, dispositivo.ip, routerData.modo_control)
          } catch (reactivarError) {
            console.error("Error al reactivar cliente:", reactivarError)
            toast({
              title: "Advertencia",
              description: "Pago registrado pero hubo un error al reactivar el servicio en el router",
              variant: "destructive",
            })
          }
        }
      }

      toast({
        title: "Pago registrado",
        description: "El pago ha sido registrado exitosamente",
      })

      // Redirigir a la página del cliente
      navigation.push(`/clientes/${formData.cliente_id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al registrar el pago",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
          <Link href={clienteId ? `/clientes/${clienteId}` : "/pagos"}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Registrar Pago</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} autoComplete="off">
          <CardHeader>
            <CardTitle>Información del Pago</CardTitle>
            <CardDescription>Registra un nuevo pago para el cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 relative">
              <Label htmlFor="cliente_id">Cliente</Label>
              <Input
                id="cliente_id"
                name="cliente_id"
                value={clienteInput}
                onChange={handleClienteInput}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={handleClienteInputKeyDown}
                placeholder="Buscar cliente por nombre"
                autoComplete="off"
                required
              />
              {showSuggestions && clienteInput && (
                <div className="absolute z-10 bg-white dark:bg-gray-800 border rounded w-full max-h-60 overflow-y-auto shadow">
                  {clientes.filter(c => c.nombre.toLowerCase().includes(clienteInput.toLowerCase())).length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">No hay resultados</div>
                  )}
                  {clientes.filter(c => c.nombre.toLowerCase().includes(clienteInput.toLowerCase())).map((cliente) => (
                    <div
                      key={cliente.id}
                      className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onMouseDown={() => handleClienteSelect(cliente)}
                    >
                      {cliente.nombre}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {clienteSeleccionado && facturacion && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Información de Facturación</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Plan</p>
                    <p className="text-sm text-muted-foreground">{facturacion.planes && typeof facturacion.planes === 'object' ? facturacion.planes.nombre : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Precio</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(facturacion.planes && typeof facturacion.planes === 'object' && typeof facturacion.planes.precio === 'number' ? facturacion.planes.precio : 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estado</p>
                    <p className="text-sm text-muted-foreground">{facturacion.estado_pago}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estado Cliente</p>
                    <p className="text-sm text-muted-foreground">{clienteSeleccionado.estado}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mes">Mes</Label>
                <Select value={formData.mes} onValueChange={handleMesChange} name="mes">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((mes) => (
                      <SelectItem key={mes.id} value={mes.id.toString()}>{mes.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="anio">Año</Label>
                <Select value={formData.anio} onValueChange={handleAnioChange} name="anio">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIOS.map((anio) => (
                      <SelectItem key={anio} value={anio.toString()}>{anio}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="monto">Monto</Label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monto}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_pago">Fecha de Pago</Label>
                <Input
                  id="fecha_pago"
                  name="fecha_pago"
                  type="date"
                  value={formData.fecha_pago}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="metodo">Método de Pago</Label>
                <Select value={formData.metodo} onValueChange={(value) => handleSelectChange("metodo", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="deposito">Depósito</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referencia">Referencia</Label>
                <Input
                  id="referencia"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" name="notas" value={formData.notas} onChange={handleChange} placeholder="Opcional" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href={clienteId ? `/clientes/${clienteId}` : "/pagos"}>Cancelar</Link>
            </Button>
            <Button ref={registrarBtnRef} type="submit" disabled={isSaving || !formData.cliente_id}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Registrar Pago"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </DashboardLayout>
  )
}
