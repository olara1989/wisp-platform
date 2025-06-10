import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createServerSupabaseClient } from "@/lib/supabase"
import { formatCurrency, formatDate, getEstadoPagoColor } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

async function getClientesMorosos() {
  const supabase = createServerSupabaseClient()

  // Obtener clientes con facturas vencidas
  const { data, error } = await supabase
    .from("facturacion")
    .select(`
      *,
      clientes:cliente_id (
        id,
        nombre,
        telefono,
        email,
        estado
      ),
      planes:plan_id (
        id,
        nombre,
        precio
      )
    `)
    .or("estado_pago.eq.vencido,estado_pago.eq.pendiente")
    .order("fecha_corte")

  if (error) {
    console.error("Error al obtener clientes morosos:", error)
    return []
  }

  return data || []
}

export default async function CortesPage() {
  const clientesMorosos = await getClientesMorosos()

  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Cortes Pendientes</h1>
        <Badge variant="outline" className="ml-2">
          {clientesMorosos.length} clientes
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Clientes con Pagos Pendientes o Vencidos
          </CardTitle>
          <CardDescription>Lista de clientes que requieren atención por pagos pendientes o vencidos</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Corte</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesMorosos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No hay clientes con pagos pendientes o vencidos
                  </TableCell>
                </TableRow>
              ) : (
                clientesMorosos.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell className="font-medium">
                      <div>{factura.clientes.nombre}</div>
                      <div className="text-xs text-muted-foreground">{factura.clientes.telefono}</div>
                    </TableCell>
                    <TableCell>{factura.planes.nombre}</TableCell>
                    <TableCell>{formatCurrency(factura.planes.precio)}</TableCell>
                    <TableCell>
                      <Badge className={getEstadoPagoColor(factura.estado_pago)}>{factura.estado_pago}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(factura.fecha_corte)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/pagos/nuevo?cliente=${factura.cliente_id}`}>Registrar Pago</Link>
                        </Button>
                        <Button variant="destructive" size="sm" asChild>
                          <Link href={`/cortes/suspender?factura=${factura.id}`}>Suspender</Link>
                        </Button>
                      </div>
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
