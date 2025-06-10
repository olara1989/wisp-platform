"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { canDeletePlan } from "@/lib/api-utils"

/**
 * Página para editar un plan existente
 * Permite modificar los detalles del plan y eliminarlo si no está en uso
 *
 * @param params Parámetros de la ruta, incluye el ID del plan
 */
export default function EditarPlanPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

  // Cargar los datos del plan al iniciar
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const supabase = createClientSupabaseClient()
        const { data, error } = await supabase.from("planes").select("*").eq("id", params.id).single()

        if (error) {
          throw error
        }

        if (!data) {
          throw new Error("Plan no encontrado")
        }

        // Convertir valores numéricos a string para los inputs
        setFormData({
          nombre: data.nombre || "",
          precio: data.precio?.toString() || "",
          subida: data.subida?.toString() || "",
          bajada: data.bajada?.toString() || "",
          burst_subida: data.burst_subida?.toString() || "",
          burst_bajada: data.burst_bajada?.toString() || "",
          tiempo_burst: data.tiempo_burst?.toString() || "",
          descripcion: data.descripcion || "",
        })
      } catch (error: any) {
        console.error("Error al cargar plan:", error)
        toast({
          title: "Error",
          description: error.message || "No se pudo cargar la información del plan",
          variant: "destructive",
        })
        router.push("/planes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlan()
  }, [params.id, toast, router])

  /**
   * Maneja los cambios en los campos del formulario
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  /**
   * Maneja el envío del formulario para actualizar el plan
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const supabase = createClientSupabaseClient()

      // Convertir valores de string a números para guardar en la base de datos
      const planData = {
        nombre: formData.nombre,
        precio: formData.precio ? Number.parseFloat(formData.precio) : null,
        subida: formData.subida ? Number.parseInt(formData.subida) : null,
        bajada: formData.bajada ? Number.parseInt(formData.bajada) : null,
        burst_subida: formData.burst_subida ? Number.parseInt(formData.burst_subida) : null,
        burst_bajada: formData.burst_bajada ? Number.parseInt(formData.burst_bajada) : null,
        tiempo_burst: formData.tiempo_burst ? Number.parseInt(formData.tiempo_burst) : null,
        descripcion: formData.descripcion,
      }

      const { error } = await supabase.from("planes").update(planData).eq("id", params.id)

      if (error) {
        console.error("Error al actualizar plan:", error)
        throw error
      }

      toast({
        title: "Plan actualizado",
        description: "El plan ha sido actualizado exitosamente",
      })

      // Forzar la navegación con replace para asegurar que se recarga la página
      router.replace("/planes")
    } catch (error: any) {
      console.error("Error en handleSubmit:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al actualizar el plan",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Maneja la eliminación del plan
   * Verifica si el plan puede ser eliminado antes de proceder
   */
  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const supabase = createClientSupabaseClient()

      // Verificar si el plan puede ser eliminado
      const { canDelete, message } = await canDeletePlan(supabase, params.id)

      if (!canDelete) {
        toast({
          title: "No se puede eliminar",
          description: message || "Este plan no puede ser eliminado porque está en uso",
          variant: "destructive",
        })
        setIsDeleting(false)
        return
      }

      // Eliminar el plan
      const { error } = await supabase.from("planes").delete().eq("id", params.id)

      if (error) {
        console.error("Error al eliminar plan:", error)
        throw error
      }

      toast({
        title: "Plan eliminado",
        description: "El plan ha sido eliminado exitosamente",
      })

      // Forzar la navegación con replace para asegurar que se recarga la página
      router.replace("/planes")
    } catch (error: any) {
      console.error("Error al eliminar plan:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al eliminar el plan",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Mostrar indicador de carga mientras se obtienen los datos
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
          <Link href="/planes">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Editar Plan</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información del Plan</CardTitle>
            <CardDescription>Actualiza los datos del plan de internet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campos del formulario */}
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
            {/* ... (código del formulario) ... */}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/planes">Cancelar</Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente el plan de internet.
                      {isDeleting && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Si el plan está siendo utilizado por clientes y necesitas eliminarlo de todas formas, puedes
                          usar la{" "}
                          <Link href={`/planes/${params.id}/eliminar`} className="text-primary hover:underline">
                            eliminación forzada
                          </Link>
                          .
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Eliminando...
                        </>
                      ) : (
                        "Eliminar"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

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
          </CardFooter>
        </form>
      </Card>
    </DashboardLayout>
  )
}
