"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore"

export default function EliminarPlanPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [facturaciones, setFacturaciones] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener plan
        const docRef = doc(db, "planes", params.id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error("Plan no encontrado")
        }

        const planData = { id: docSnap.id, ...docSnap.data() }
        setPlan(planData)

        // Obtener facturaciones que usan este plan
        const q = query(collection(db, "facturacion"), where("plan_id", "==", params.id))
        const querySnapshot = await getDocs(q)

        const factData: any[] = []
        for (const d of querySnapshot.docs) {
          const fData = d.data()
          // En Firebase, si clientes es una subcolección o si tenemos el ID, 
          // aquí tendríamos que hacer un fetch adicional si queremos nombres.
          // Por ahora mantenemos la lógica simple.
          factData.push({ id: d.id, ...fData })
        }
        setFacturaciones(factData)
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

  const handleForceDelete = async () => {
    setIsDeleting(true)

    try {
      const batch = writeBatch(db)

      // Actualizar facturaciones asociadas
      if (facturaciones.length > 0) {
        facturaciones.forEach((factura) => {
          const fRef = doc(db, "facturacion", factura.id)
          batch.update(fRef, { plan_id: null })
        })
      }

      // Eliminar el plan
      const pRef = doc(db, "planes", params.id)
      batch.delete(pRef)

      await batch.commit()

      toast({
        title: "Plan eliminado",
        description: "El plan ha sido eliminado exitosamente",
      })

      router.replace("/planes")
      router.refresh()
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
              Facturaciones Afectadas
            </CardTitle>
            <CardDescription>
              Hay {facturaciones.length} registro(s) de facturación que usan este plan. Se les quitará la referencia al plan.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Confirmación</CardTitle>
          <CardDescription>
            {facturaciones.length > 0
              ? `Esta acción eliminará el plan y afectará a ${facturaciones.length} facturación(es).`
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
