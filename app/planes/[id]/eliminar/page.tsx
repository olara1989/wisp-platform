"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase"
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

/**
 * Página para forzar la eliminación de un plan
 * Permite eliminar un plan incluso si está siendo utilizado por clientes
 * Muestra advertencias y los clientes que serán afectados
 *
 * @param params Parámetros de la ruta, incluye el ID del plan
 */
export default function EliminarPlanPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [facturaciones, setFacturaciones] = useState<any[]>([])

  // Cargar los datos del plan y las facturaciones relacionadas
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClientSupabaseClient()

        // Obtener plan
        const { data: planData, error: planError } = await supabase
          .from("planes")
          .select("*")
          .eq("id", params.id)
          .single()

        if (planError) throw planError
        if (!planData) throw new Error("Plan no encontrado")

        setPlan(planData)

        // Obtener facturaciones que usan este plan
        const { data: factData, error: factError } = await supabase
          .from("facturacion")
          .select(`
            *,
            clientes:cliente_id (
              id,
              nombre,
              telefono,
              email
            )
          `)
          .eq("plan_id", params.id)
          .order("periodo_inicio", { ascending: false })

        if (factError) throw factError
        setFacturaciones(factData || [])
      } catch (error: any) {
        console.error("Error al cargar datos:", error)
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

    fetchData()
  }, [params.id, toast, router])

  /**
   * Maneja la eliminación forzada del plan
   * Actualiza las facturaciones relacionadas antes de eliminar el plan
   */
  const handleForceDelete = async () => {
    setIsDeleting(true)

    try {
      const supabase = createClientSupabaseClient()

      // Si hay facturaciones, primero actualizamos todas para quitar la referencia al plan
      if (facturaciones.length > 0) {
        // Actualizar todas las facturaciones para usar un plan nulo
        const { error: updateError } = await supabase
          .from("facturacion")
          .update({ plan_id: null })
          .eq("plan_id", params.id)

        if (updateError) throw updateError
      }

      // Ahora eliminamos el plan
      const { error: deleteError } = await supabase.from("planes").delete().eq("id", params.id)

      if (deleteError) throw deleteError

      toast({
        title: "Plan eliminado",
        description: "El plan ha sido eliminado exitosamente",
      })

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
          <Link href={`/planes/${params.id}/editar`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Eliminar Plan</h1>
      </div>

      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Advertencia</AlertTitle>
        <AlertDescription>
          Estás a punto de forzar la eliminación de un plan. Esta acción es irreversible y puede afectar a los clientes
          que tienen este plan asignado.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información del Plan</CardTitle>
          <CardDescription>Detalles del plan que será eliminado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-medium">Nombre</p>
              <p className="text-sm text-muted-foreground">{plan?.nombre}</p>
            </div>
            <div>
              <p className="font-medium">Precio</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(plan?.precio)}</p>
            </div>
            <div>
              <p className="font-medium">Velocidad</p>
              <p className="text-sm text-muted-foreground">
                {plan?.subida} Mbps / {plan?.bajada} Mbps
              </p>
            </div>
            <div>
              <p className="font-medium">Descripción</p>
              <p className="text-sm text-muted-foreground">{plan?.descripcion || "Sin descripción"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {facturaciones.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Clientes Afectados
            </CardTitle>
            <CardDescription>
              Los siguientes clientes tienen este plan asignado y se verán afectados por la eliminación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {facturaciones.map((factura) => (
                <li key={factura.id} className="p-2 border rounded-md">
                  <div className="font-medium">{factura.clientes?.nombre}</div>
                  <div className="text-sm text-muted-foreground">{factura.clientes?.telefono}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Confirmación</CardTitle>
          <CardDescription>
            {facturaciones.length > 0
              ? `Esta acción eliminará el plan y afectará a ${facturaciones.length} cliente(s).`
              : "Esta acción eliminará el plan permanentemente."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href={`/planes/${params.id}/editar`}>Cancelar</Link>
          </Button>
          <Button variant="destructive" onClick={handleForceDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Forzar Eliminación"
            )}
          </Button>
        </CardFooter>
      </Card>
    </DashboardLayout>
  )
}
