"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RegionSelect } from "@/components/ui/region-select"
import dynamic from "next/dynamic"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

const DynamicGoogleMapInput = dynamic(() => import("@/components/ui/google-map-input").then((mod) => mod.GoogleMapInput), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
})

type Plan = {
  id: string
  nombre: string
  precio: number
}

interface ClientFormData {
  nombre: string
  telefono: string
  email?: string | null
  direccion?: string | null
  ip: string
  region: string
  plan: string
  latitud: number | null
  longitud: number | null
  antena?: string | null
  db?: number | null
  prestada: boolean;
}

export default function NuevoClientePage() {
  console.log("[NUEVO CLIENTE] Component rendered")

  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ClientFormData>({
    nombre: "",
    telefono: "",
    email: null,
    direccion: null,
    ip: "",
    region: "",
    plan: "",
    latitud: null,
    longitud: null,
    antena: null,
    db: null,
    prestada: true,
  })
  const [planes, setPlanes] = useState<Plan[]>([])

  useEffect(() => {
    const fetchPlanes = async () => {
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase
        .from('planes')
        .select('id, nombre, precio')
        .order('nombre')
        .returns<Plan[]>()

      if (error) {
        console.error('Error al obtener planes:', error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los planes",
          variant: "destructive",
        })
        return
      }

      setPlanes(data || [])
    }

    fetchPlanes()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    console.log(`[NUEVO CLIENTE] Field changed: ${name} = ${value}`)
  }

  const handleRegionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, region: value }))
    console.log(`[NUEVO CLIENTE] Region changed: ${value}`)
  }

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitud: lat,
      longitud: lng,
    }))
    console.log(`[NUEVO CLIENTE] Location changed: Lat ${lat}, Lng ${lng}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[NUEVO CLIENTE] Form submitted with data:", formData)

    // Validación básica: ahora solo los campos obligatorios principales
    if (
      !formData.nombre.trim() ||
      !formData.telefono.trim() ||
      !formData.ip.trim() ||
      !formData.region.trim() ||
      !formData.plan.trim() || // Plan ahora es requerido
      formData.latitud === null ||
      formData.longitud === null
    ) {
      toast({
        title: "Error de validación",
        description: "Por favor completa todos los campos requeridos (Nombre, Teléfono, IP, Región, Plan y Ubicación).",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClientSupabaseClient()
      console.log("[NUEVO CLIENTE] Supabase client created")

      // Preparar datos para insertar
      const clienteData = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email?.trim() || null,
        direccion: formData.direccion?.trim() || null,
        ip: formData.ip.trim(),
        region: formData.region.trim(),
        plan: formData.plan.trim(),
        latitud: formData.latitud,
        longitud: formData.longitud,
        antena: formData.antena || null,
        db: formData.db !== null ? Number(formData.db) : null,
        prestada: formData.prestada, // Incluir el valor booleano de prestada
        estado: "activo",
        fecha_alta: new Date().toISOString().split("T")[0],
      }

      console.log("[NUEVO CLIENTE] Inserting client data:", clienteData)

      const { data, error } = await supabase.from("clientes").insert(clienteData).select()

      if (error) {
        console.error("[NUEVO CLIENTE] Supabase error:", error)
        throw new Error(error.message || "Error al crear el cliente")
      }

      if (!data || data.length === 0) {
        throw new Error("No se pudo crear el cliente")
      }

      console.log("[NUEVO CLIENTE] Client created successfully:", data[0])

      toast({
        title: "Cliente creado",
        description: `El cliente ${formData.nombre} ha sido creado exitosamente`,
      })

      // Redirigir a la lista de clientes
      router.push("/clientes")
    } catch (error: any) {
      console.error("[NUEVO CLIENTE] Error creating client:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al crear el cliente",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header simple sin DashboardLayout */}
      <div className="sticky top-0 z-10 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          <Button variant="ghost" size="icon" asChild className="mr-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
            <Link href="/clientes">
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400 inline" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Cliente</h1>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tarjeta de Información Personal y de Contacto */}
          <Card className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-200">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-0">Información Personal y de Contacto</CardTitle>
              <CardDescription className="text-sm text-muted-foreground dark:text-gray-400">Detalles básicos del cliente y su información de contacto.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Nombre y apellido del cliente"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej: 5512345678"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Opcional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    placeholder="Correo electrónico del cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección (Opcional)</Label>
                  <Textarea
                    id="direccion"
                    name="direccion"
                    value={formData.direccion || ''}
                    onChange={handleChange}
                    placeholder="Dirección completa del cliente"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Detalles de Conexión */}
          <Card className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-200">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-0">Detalles de Conexión</CardTitle>
              <CardDescription className="text-sm text-muted-foreground dark:text-gray-400">Información técnica sobre la conexión del cliente.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ip">Dirección IP</Label>
                  <Input
                    id="ip"
                    name="ip"
                    value={formData.ip}
                    onChange={handleChange}
                    placeholder="Ej: 192.168.1.100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Región</Label>
                  <RegionSelect
                    value={formData.region}
                    onValueChange={handleRegionChange}
                    placeholder="Selecciona una región"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan Asignado</Label>
                  <Select name="plan" value={formData.plan} onValueChange={(value) => setFormData((prev) => ({ ...prev, plan: value }))} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {planes.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.nombre} - ${plan.precio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="antena">Tipo de Antena</Label>
                  <Select name="antena" value={formData.antena || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, antena: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de antena" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LiteBeam M5">LiteBeam M5</SelectItem>
                      <SelectItem value="LiteBeam M5 AC">LiteBeam M5 AC</SelectItem>
                      <SelectItem value="Loco M2">Loco M2</SelectItem>
                      <SelectItem value="Loco M5">Loco M5</SelectItem>
                      <SelectItem value="Loco M5 AC">Loco M5 AC</SelectItem>
                      <SelectItem value="AirGrid">AirGrid</SelectItem>
                      <SelectItem value="PowerBeam M5">PowerBeam M5</SelectItem>
                      <SelectItem value="PowerBeam M5 AC">PowerBeam M5 AC</SelectItem>
                      <SelectItem value="Cable Ethernet">Cable Ethernet</SelectItem>
                      <SelectItem value="Fibra Conversor">Fibra Conversor</SelectItem>
                      <SelectItem value="Fibra Onu">Fibra Onu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="db">Valor DB</Label>
                  <Input
                    id="db"
                    name="db"
                    type="number"
                    value={formData.db === null ? '' : formData.db} // Manejar valor nulo para el input
                    onChange={(e) => setFormData((prev) => ({ ...prev, db: e.target.value === '' ? null : Number(e.target.value) }))}
                    placeholder="Valor numérico de DB (Opcional)"
                  />
                </div>
                {/* Checkbox para Prestada */}
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox
                    id="prestada"
                    checked={formData.prestada}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, prestada: typeof checked === 'boolean' ? checked : false }))}
                  />
                  <Label htmlFor="prestada">Antena Prestada</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Ubicación del Cliente */}
          <Card className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-200">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-0">Ubicación del Cliente</CardTitle>
              <CardDescription className="text-sm text-muted-foreground dark:text-gray-400">Selecciona la ubicación del cliente en el mapa.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-2">
              <Label htmlFor="latitud">Ubicación en el Mapa</Label>
              <DynamicGoogleMapInput
                initialLat={formData.latitud || undefined}
                initialLng={formData.longitud || undefined}
                onLocationChange={handleLocationChange}
              />
              {formData.latitud && formData.longitud && (
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Lat: {formData.latitud.toFixed(6)}, Lng: {formData.longitud.toFixed(6)}
                </p>
              )}
              {/* Validación para asegurar que la ubicación sea seleccionada */}
              {!formData.latitud || !formData.longitud ? (
                <p className="text-sm text-destructive dark:text-red-400">Por favor, selecciona una ubicación en el mapa.</p>
              ) : null}
            </CardContent>
          </Card>

          <div className="max-w-2xl mx-auto flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crear Cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
