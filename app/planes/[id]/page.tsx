"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeft, Edit, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"

export default function PlanDetallePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const docRef = doc(db, "planes", params.id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setPlan({ id: docSnap.id, ...docSnap.data() })
        } else {
          toast({
            title: "Error",
            description: "Plan no encontrado",
            variant: "destructive",
          })
          router.push("/planes")
        }
      } catch (error) {
        console.error("Error fetching plan:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [params.id, router, toast])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!plan) return null

  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/planes">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{plan.nombre}</h1>
        <div className="ml-auto">
          <Button asChild>
            <Link href={`/planes/${plan.id}/editar`}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Plan</CardTitle>
          <CardDescription>Información completa del plan de internet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Información General</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nombre:</span>
                  <span className="text-sm font-medium">{plan.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Precio:</span>
                  <span className="text-sm font-medium">{formatCurrency(plan.precio)}</span>
                </div>
                {plan.descripcion && (
                  <div>
                    <span className="text-sm text-muted-foreground">Descripción:</span>
                    <p className="text-sm mt-1">{plan.descripcion}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Velocidades</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Velocidad de Subida:</span>
                  <span className="text-sm font-medium">{plan.subida} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Velocidad de Bajada:</span>
                  <span className="text-sm font-medium">{plan.bajada} Mbps</span>
                </div>
                {plan.burst_subida && plan.burst_bajada && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ráfaga de Subida:</span>
                      <span className="text-sm font-medium">{plan.burst_subida} Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ráfaga de Bajada:</span>
                      <span className="text-sm font-medium">{plan.burst_bajada} Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tiempo de Ráfaga:</span>
                      <span className="text-sm font-medium">{plan.tiempo_burst} segundos</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
