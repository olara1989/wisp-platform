import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { Users, Package, CreditCard, AlertTriangle, Router } from "lucide-react"
import { cache } from "react"

// Usar cache para evitar múltiples llamadas a la base de datos
const getStats = cache(async () => {
  const supabase = createServerSupabaseClient()

  // Ejecutar consultas en paralelo para mejorar el rendimiento
  const [clientesResult, morososResult, planesResult, routersResult] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("clientes").select("*", { count: "exact", head: true }).eq("estado", "moroso"),
    supabase.from("planes").select("*", { count: "exact", head: true }),
    supabase.from("routers").select("*", { count: "exact", head: true }),
  ])

  // Obtener suma de pagos del mes actual
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const { data: pagosMes } = await supabase
    .from("pagos")
    .select("monto")
    .gte("fecha_pago", firstDayOfMonth)
    .lte("fecha_pago", lastDayOfMonth)

  const totalPagosMes = pagosMes?.reduce((sum, pago) => sum + Number(pago.monto), 0) || 0

  return {
    clientesCount: clientesResult.count || 0,
    clientesMorosos: morososResult.count || 0,
    planesCount: planesResult.count || 0,
    routersCount: routersResult.count || 0,
    totalPagosMes,
  }
})

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clientesCount}</div>
              <p className="text-xs text-muted-foreground">Clientes registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Morosos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clientesMorosos}</div>
              <p className="text-xs text-muted-foreground">Pendientes de pago</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalPagosMes)}</div>
              <p className="text-xs text-muted-foreground">Mes actual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planes Activos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.planesCount}</div>
              <p className="text-xs text-muted-foreground">Planes disponibles</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Routers Mikrotik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-6">
                <div className="flex flex-col items-center">
                  <Router className="h-16 w-16 text-primary mb-4" />
                  <div className="text-3xl font-bold">{stats.routersCount}</div>
                  <p className="text-sm text-muted-foreground">Routers configurados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Activos</span>
                      <span className="text-sm font-medium">{stats.clientesCount - stats.clientesMorosos}</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{
                          width: `${
                            stats.clientesCount
                              ? ((stats.clientesCount - stats.clientesMorosos) / stats.clientesCount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Morosos</span>
                      <span className="text-sm font-medium">{stats.clientesMorosos}</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-yellow-500"
                        style={{
                          width: `${stats.clientesCount ? (stats.clientesMorosos / stats.clientesCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
