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
  email: string
  direccion: string
  ip: string
  region: string
  plan: string
  latitud: number | null
  longitud: number | null
}

export default function NuevoClientePage() {
  console.log("[NUEVO CLIENTE] Component rendered")

  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<ClientFormData>({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    ip: "",
    region: "",
    plan: "",
    latitud: null,
    longitud: null,
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

    // Validación básica
    if (
      !formData.nombre.trim() ||
      !formData.telefono.trim() ||
      !formData.email.trim() ||
      !formData.direccion.trim() ||
      !formData.ip.trim() ||
      !formData.region.trim() ||
      formData.latitud === null ||
      formData.longitud === null
    ) {
      toast({
        title: "Error de validación",
        description: "Por favor completa todos los campos requeridos y selecciona una ubicación en el mapa.",
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
        email: formData.email.trim().toLowerCase(),
        direccion: formData.direccion.trim(),
        ip: formData.ip.trim(),
        region: formData.region.trim(),
        plan: formData.plan.trim(),
        latitud: formData.latitud,
        longitud: formData.longitud,
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
    <div className="min-h-screen bg-background">
      {/* Header simple sin DashboardLayout */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Button variant="outline" size="icon" asChild className="mr-4">
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Nuevo Cliente</h1>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
              <CardDescription>Ingresa los datos del nuevo cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ip">IP *</Label>
                  <Input
                    id="ip"
                    name="ip"
                    value={formData.ip}
                    onChange={handleChange}
                    required
                    placeholder="Ej: x.x.1.1"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    placeholder="Ej: +52 55 1234 5678"
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="region">Región</Label>
                  <RegionSelect
                    value={formData.region}
                    onValueChange={handleRegionChange}
                    placeholder="Seleccione una región"
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="plan">Plan *</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value) => setFormData({ ...formData, plan: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un plan" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Ej: juan@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Calle Principal #123, Colonia Centro, Ciudad, Estado"
                  rows={3}
                />
              </div>

              {/* Mapa de ubicación */}
              <div className="space-y-2">
                <Label>Ubicación en el mapa *</Label>
                <DynamicGoogleMapInput onLocationChange={handleLocationChange} />
                {formData.latitud && formData.longitud && (
                  <p className="text-sm text-muted-foreground">
                    Lat: {(formData.latitud as number).toFixed(6)}, Lng: {(formData.longitud as number).toFixed(6)}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/clientes">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cliente"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
