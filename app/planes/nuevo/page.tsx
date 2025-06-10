"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function NuevoPlanPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    subida: "",
    bajada: "",
    burst_subida: "",
    burst_bajada: "",
    tiempo_burst: "",
    descripcion: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClientSupabaseClient()

      // Convertir valores numéricos
      const planData = {
        nombre: formData.nombre,
        precio: Number.parseFloat(formData.precio),
        subida: Number.parseInt(formData.subida),
        bajada: Number.parseInt(formData.bajada),
        burst_subida: formData.burst_subida ? Number.parseInt(formData.burst_subida) : null,
        burst_bajada: formData.burst_bajada ? Number.parseInt(formData.burst_bajada) : null,
        tiempo_burst: formData.tiempo_burst ? Number.parseInt(formData.tiempo_burst) : null,
        descripcion: formData.descripcion,
      }

      const { data, error } = await supabase.from("planes").insert(planData).select()

      if (error) {
        throw error
      }

      toast({
        title: "Plan creado",
        description: "El plan ha sido creado exitosamente",
      })

      router.push("/planes")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al crear el plan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/planes">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Nuevo Plan</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información del Plan</CardTitle>
            <CardDescription>Ingresa los datos del nuevo plan de internet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Plan</Label>
                <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio">Precio Mensual</Label>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subida">Velocidad de Subida (Mbps)</Label>
                <Input
                  id="subida"
                  name="subida"
                  type="number"
                  min="0"
                  value={formData.subida}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bajada">Velocidad de Bajada (Mbps)</Label>
                <Input
                  id="bajada"
                  name="bajada"
                  type="number"
                  min="0"
                  value={formData.bajada}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="burst_subida">Ráfaga Subida (Mbps)</Label>
                <Input
                  id="burst_subida"
                  name="burst_subida"
                  type="number"
                  min="0"
                  value={formData.burst_subida}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="burst_bajada">Ráfaga Bajada (Mbps)</Label>
                <Input
                  id="burst_bajada"
                  name="burst_bajada"
                  type="number"
                  min="0"
                  value={formData.burst_bajada}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiempo_burst">Tiempo Ráfaga (segundos)</Label>
                <Input
                  id="tiempo_burst"
                  name="tiempo_burst"
                  type="number"
                  min="0"
                  value={formData.tiempo_burst}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/planes">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Plan"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </DashboardLayout>
  )
}
