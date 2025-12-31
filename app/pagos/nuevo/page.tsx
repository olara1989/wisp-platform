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
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, orderBy } from "firebase/firestore"
import { reactivarCliente } from "@/lib/mikrotik"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Alert } from "@/components/ui/alert"


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
  const { userRole } = useAuth()

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

  // Estados para múltiples pagos
  const [registrarMultiples, setRegistrarMultiples] = useState(false)
  const [mesesSeleccionados, setMesesSeleccionados] = useState<string[]>([])

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

  const [puedeRegistrar, setPuedeRegistrar] = useState(true)
  const [alertaPago, setAlertaPago] = useState("")


  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "clientes"), orderBy("nombre"))
        const querySnapshot = await getDocs(q)
        const clientesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Cliente[]
        setClientes(clientesData)

        if (clienteId) {
          const cliente = clientesData.find((c) => c.id === clienteId)
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
      // 1. Get Client
      const clientDoc = await getDoc(doc(db, "clientes", id))
      if (!clientDoc.exists()) return
      const cliente = { id: clientDoc.id, ...clientDoc.data() } as Cliente
      setClienteSeleccionado(cliente)

      // 2. Get Plan
      if (cliente.plan) {
        // Assuming plan is stored as ID in cliente.plan
        // Check if it's a string ID or something else. Typically string in Firestore refactor.
        const planRef = doc(db, "planes", cliente.plan)
        const planSnap = await getDoc(planRef)
        if (planSnap.exists()) {
          const planData = planSnap.data()
          // Use type assertion or check
          const precio = planData.precio
          if (precio && !isNaN(Number(precio))) {
            setFormData((prev) => ({ ...prev, monto: Number(precio).toString() }))
            setTimeout(() => {
              registrarBtnRef.current?.focus()
            }, 100)
          } else {
            setFormData((prev) => ({ ...prev, monto: "" }))
          }
        } else {
          setFormData((prev) => ({ ...prev, monto: "" }))
        }
      } else {
        setFormData((prev) => ({ ...prev, monto: "" }))
      }

      // 3. Get Dispositivo & Router
      // Query dispositivos where cliente_id == id
      const devicesQ = query(collection(db, "dispositivos"), where("cliente_id", "==", id))
      const devicesSnap = await getDocs(devicesQ)

      if (!devicesSnap.empty) {
        const deviceDoc = devicesSnap.docs[0]
        const deviceData = { id: deviceDoc.id, ...deviceDoc.data() } as any

        if (deviceData.router_id) {
          const routerSnap = await getDoc(doc(db, "routers", deviceData.router_id))
          if (routerSnap.exists()) {
            setDispositivo(deviceData)
            setRouterData({ id: routerSnap.id, ...routerSnap.data() })
          }
        }
      }

    } catch (error) {
      console.error("Error al cargar datos del cliente:", error)
    }
  }

  const handleClienteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClienteInput(e.target.value)
    setShowSuggestions(true)
    setFormData((prev) => ({ ...prev, cliente_id: "", monto: "" })) // Limpiar monto al limpiar cliente
    setClienteSeleccionado(null)
    setFacturacion(null)
  }

  const handleClienteSelect = async (cliente: any) => {
    setClienteInput(cliente.nombre)
    setShowSuggestions(false)
    setFormData((prev) => ({ ...prev, cliente_id: String(cliente.id) }))
    setAlertaPago("")
    setPuedeRegistrar(true)
    await fetchClienteData(cliente.id)

    // Verificar todos los meses pendientes de pago
    try {
      // Obtener todos los pagos del cliente
      const pagosQ = query(
        collection(db, "pagos"),
        where("cliente_id", "==", cliente.id)
      )
      const pagosSnap = await getDocs(pagosQ)

      // Si no hay pagos, no hay pendientes que verificar
      if (pagosSnap.empty) {
        setAlertaPago("")
        setPuedeRegistrar(true)
        return
      }

      // Crear un Set con los meses/años que ya tienen pago
      const mesesPagados = new Set<string>()
      let primerPagoFecha: Date | null = null
      let ultimoPagoFecha: Date | null = null

      pagosSnap.forEach(doc => {
        const pago = doc.data()
        mesesPagados.add(`${pago.mes}-${pago.anio}`)

        const fechaPago = new Date(Number(pago.anio), Number(pago.mes) - 1)

        if (!primerPagoFecha || fechaPago < primerPagoFecha) {
          primerPagoFecha = fechaPago
        }
        if (!ultimoPagoFecha || fechaPago > ultimoPagoFecha) {
          ultimoPagoFecha = fechaPago
        }
      })

      // Verificar cada mes desde el PRIMER pago hasta el mes anterior al actual
      const mesesPendientes: string[] = []

      if (primerPagoFecha) {
        let mesVerificar = primerPagoFecha.getMonth() + 1 // Mes del primer pago
        let anioVerificar = primerPagoFecha.getFullYear()

        // Verificar hasta el mes anterior al actual
        while (anioVerificar < anioActual || (anioVerificar === anioActual && mesVerificar < mesActual)) {
          const claveMes = `${mesVerificar}-${anioVerificar}`

          // Si este mes NO está pagado, agregarlo a pendientes
          if (!mesesPagados.has(claveMes)) {
            const nombreMes = MESES.find(m => m.id === mesVerificar)?.nombre || mesVerificar.toString()
            mesesPendientes.push(`${nombreMes} ${anioVerificar}`)
          }

          // Avanzar al siguiente mes
          mesVerificar++
          if (mesVerificar > 12) {
            mesVerificar = 1
            anioVerificar++
          }
        }
      }

      if (mesesPendientes.length > 0) {
        const listaMeses = mesesPendientes.join(", ")
        setAlertaPago(`El cliente tiene pagos pendientes de los siguientes meses: ${listaMeses}. Por favor, verifica la situación antes de registrar un nuevo pago.`)
        setPuedeRegistrar(false)
      } else {
        setAlertaPago("")
        setPuedeRegistrar(true)
      }
    } catch (err) {
      console.error("Error al verificar pagos pendientes:", err)
      setAlertaPago("No se pudo verificar los pagos pendientes. Intenta nuevamente.")
      setPuedeRegistrar(false)
    }
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

  const toggleMesSeleccionado = (mesId: string) => {
    setMesesSeleccionados(prev => {
      if (prev.includes(mesId)) {
        return prev.filter(m => m !== mesId)
      } else {
        return [...prev, mesId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Corregir la fecha para evitar desfase por zona horaria
      let fechaPago = formData.fecha_pago
      if (fechaPago) {
        if (typeof fechaPago !== "string") {
          const d = new Date(fechaPago)
          fechaPago = d.toISOString().split("T")[0]
        }
      }

      // Si es registro múltiple, crear un pago por cada mes seleccionado
      if (registrarMultiples && mesesSeleccionados.length > 0) {
        for (const mesId of mesesSeleccionados) {
          await addDoc(collection(db, "pagos"), {
            cliente_id: formData.cliente_id,
            monto: Number.parseFloat(formData.monto),
            metodo: formData.metodo,
            referencia: formData.referencia,
            notas: formData.notas,
            fecha_pago: fechaPago,
            mes: mesId,
            anio: formData.anio,
            created_at: new Date()
          })
        }
      } else {
        // Registro simple de un solo pago
        await addDoc(collection(db, "pagos"), {
          ...formData,
          fecha_pago: fechaPago,
          monto: Number.parseFloat(formData.monto),
          mes: formData.mes,
          anio: formData.anio,
          created_at: new Date()
        })
      }

      // Actualizar estado de facturación
      if (facturacion) {
        await updateDoc(doc(db, "facturacion", facturacion.id), { estado_pago: "pagado" })
      }

      // Actualizar estado del cliente si estaba suspendido
      if (clienteSeleccionado && (clienteSeleccionado.estado === "suspendido" || clienteSeleccionado.estado === "moroso")) {
        await updateDoc(doc(db, "clientes", clienteSeleccionado.id), { estado: "activo" })

        // Reactivar servicio en Mikrotik si el cliente estaba suspendido
        if (clienteSeleccionado.estado === "suspendido" && dispositivo && routerData) {
          try {
            await reactivarCliente(routerData.id, dispositivo.ip, routerData.modo_control || "address-list")
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
        title: registrarMultiples ? "Pagos registrados" : "Pago registrado",
        description: registrarMultiples
          ? `Se registraron ${mesesSeleccionados.length} pagos exitosamente`
          : "El pago ha sido registrado exitosamente",
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
            {alertaPago && (
              <Alert variant={registrarMultiples ? "default" : "destructive"}>
                <div className="flex flex-col gap-2">
                  <p>{alertaPago}</p>
                  {userRole === "admin" && !registrarMultiples && (
                    <p className="text-sm font-medium">
                      💡 Puedes usar la opción "Registrar múltiples pagos" para registrar los meses pendientes de una sola vez.
                    </p>
                  )}
                </div>
              </Alert>
            )}
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

            {/* Opción de múltiples pagos - Solo para administradores */}
            {userRole === "admin" && (
              <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <Checkbox
                  id="registrar-multiples"
                  checked={registrarMultiples}
                  onCheckedChange={(checked) => {
                    setRegistrarMultiples(checked as boolean)
                    if (!checked) {
                      setMesesSeleccionados([])
                    }
                  }}
                />
                <Label
                  htmlFor="registrar-multiples"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Registrar múltiples pagos (varios meses a la vez)
                </Label>
              </div>
            )}

            {/* Selector de meses múltiples */}
            {registrarMultiples && (
              <div className="space-y-3 p-4 bg-muted rounded-lg border">
                <Label className="text-base font-semibold">Selecciona los meses a pagar:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {MESES.map((mes) => (
                    <div key={mes.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`mes-${mes.id}`}
                        checked={mesesSeleccionados.includes(mes.id.toString())}
                        onCheckedChange={() => toggleMesSeleccionado(mes.id.toString())}
                      />
                      <Label
                        htmlFor={`mes-${mes.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {mes.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
                {mesesSeleccionados.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Meses seleccionados: {mesesSeleccionados.length} - Total: {formatCurrency(Number.parseFloat(formData.monto || "0") * mesesSeleccionados.length)}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!registrarMultiples && (
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
              )}
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
            <Button
              ref={registrarBtnRef}
              type="submit"
              disabled={
                isSaving ||
                !formData.cliente_id ||
                (!registrarMultiples && !puedeRegistrar) ||
                (registrarMultiples && mesesSeleccionados.length === 0)
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                registrarMultiples ? `Registrar ${mesesSeleccionados.length} Pago${mesesSeleccionados.length !== 1 ? 's' : ''}` : "Registrar Pago"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </DashboardLayout>
  )
}
