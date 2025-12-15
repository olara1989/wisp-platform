"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { collection, updateDoc, getDocs, getDoc, doc, query, orderBy } from "firebase/firestore"
import { ArrowLeft, Loader2 } from "lucide-react"
import { RegionSelect } from "@/components/ui/region-select"
import dynamic from "next/dynamic"
import { Checkbox } from "@/components/ui/checkbox"

const DynamicGoogleMapInput = dynamic(() => import("@/components/ui/google-map-input").then((mod) => mod.GoogleMapInput), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
})

type Plan = {
  id: string
  nombre: string
  precio: number
}

interface Cliente {
  id: string
  nombre: string
  telefono: string
  email: string | null
  direccion: string | null
  ip: string
  region: string
  plan: string
  latitud: number | null
  longitud: number | null
  antena: string | null
  db: number | null
  prestada: boolean
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
  prestada: boolean
}

export default function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [planes, setPlanes] = useState<Plan[]>([])
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener planes
        const q = query(collection(db, 'planes'), orderBy('nombre'))
        const querySnapshot = await getDocs(q)
        const planesData: Plan[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre,
          precio: doc.data().precio
        }))
        setPlanes(planesData)

        // Obtener datos del cliente
        const docRef = doc(db, "clientes", resolvedParams.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error("Cliente no encontrado")
        }

        const cliente = docSnap.data() as Cliente;

        setFormData({
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          email: cliente.email,
          direccion: cliente.direccion,
          ip: cliente.ip,
          region: cliente.region,
          plan: cliente.plan,
          latitud: cliente.latitud,
          longitud: cliente.longitud,
          antena: cliente.antena,
          db: cliente.db,
          prestada: cliente.prestada,
        })
      } catch (error: any) {
        console.error("Error al cargar datos:", error)
        toast({
          title: "Error",
          description: error.message || "No se pudieron cargar los datos",
          variant: "destructive",
        })
        router.push("/clientes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id, toast, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, region: value }))
  }

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitud: lat,
      longitud: lng,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Validación básica
      if (
        !formData.nombre.trim() ||
        !formData.telefono.trim() ||
        !formData.ip.trim() ||
        !formData.region.trim() ||
        !formData.plan.trim() ||
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

      const docRef = doc(db, "clientes", resolvedParams.id);
      await updateDoc(docRef, {
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
        prestada: formData.prestada,
      });

      toast({
        title: "Cliente actualizado",
        description: "El cliente ha sido actualizado exitosamente",
      })

      router.push(`/clientes/${resolvedParams.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al actualizar el cliente",
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
          <Link href={`/clientes/${resolvedParams.id}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Editar Cliente</h1>
      </div>

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
                  value={formData.email || ""}
                  onChange={handleChange}
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección (Opcional)</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion || ""}
                  onChange={handleChange}
                  placeholder="Dirección completa"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Información Técnica */}
        <Card className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-200">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-0">Información Técnica</CardTitle>
            <CardDescription className="text-sm text-muted-foreground dark:text-gray-400">Detalles técnicos y de configuración del cliente.</CardDescription>
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
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select
                  name="plan"
                  value={formData.plan}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}
                  required
                >
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
                <Label htmlFor="antena">Antena (Opcional)</Label>
                <Input
                  id="antena"
                  name="antena"
                  value={formData.antena || ""}
                  onChange={handleChange}
                  placeholder="Modelo de antena"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="db">dB (Opcional)</Label>
                <Input
                  id="db"
                  name="db"
                  type="number"
                  value={formData.db || ""}
                  onChange={handleChange}
                  placeholder="Nivel de señal"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="prestada"
                  checked={formData.prestada}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, prestada: checked as boolean }))
                  }
                />
                <Label htmlFor="prestada">Equipo prestado</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Ubicación */}
        <Card className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-200">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-0">Ubicación del Cliente</CardTitle>
            <CardDescription className="text-sm text-muted-foreground dark:text-gray-400">Selecciona la ubicación exacta del cliente en el mapa.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] w-full rounded-md border">
              <DynamicGoogleMapInput
                onLocationChange={handleLocationChange}
                initialLat={formData.latitud || undefined}
                initialLng={formData.longitud || undefined}
              />
            </div>
          </CardContent>
        </Card>

        <div className="max-w-2xl mx-auto flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/clientes/${resolvedParams.id}`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  )
}
