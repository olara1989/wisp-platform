import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { Plus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

async function getPlanes() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("planes").select("*").order("precio")

    if (error) {
      console.error("Error al obtener planes:", error)
      throw error
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error al obtener planes:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Error desconocido") }
  }
}

export default async function PlanesPage() {
  const { data: planes, error } = await getPlanes()

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Planes</h1>
        <Button asChild>
          <Link href="/planes/nuevo">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los planes. Por favor, intenta de nuevo más tarde.
            {process.env.NODE_ENV === "development" && (
              <div className="mt-2 text-xs">
                <code>{error.message}</code>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Planes Disponibles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Velocidad</TableHead>
                <TableHead>Burst</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {error ? (
                      <div className="flex flex-col items-center">
                        <AlertCircle className="h-6 w-6 text-destructive mb-2" />
                        <span>Error al cargar los planes</span>
                      </div>
                    ) : (
                      "No hay planes disponibles"
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                planes.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.nombre}</TableCell>
                    <TableCell>
                      {plan.subida}Mbps / {plan.bajada}Mbps
                    </TableCell>
                    <TableCell>
                      {plan.burst_subida && plan.burst_bajada
                        ? `${plan.burst_subida}Mbps / ${plan.burst_bajada}Mbps (${plan.tiempo_burst}s)`
                        : "No disponible"}
                    </TableCell>
                    <TableCell>{formatCurrency(plan.precio)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/planes/${plan.id}/editar`}>Editar</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
