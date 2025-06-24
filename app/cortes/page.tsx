import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createServerSupabaseClient } from "@/lib/supabase"
import { formatCurrency, formatDate, getEstadoPagoColor } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

function getMesYAnoParaVerificarFromDate(date: Date) {
  const dia = date.getDate()
  let mes = date.getMonth() + 1 // 1-12
  let anio = date.getFullYear()
  if (dia < 5) {
    mes = mes - 1
    if (mes === 0) {
      mes = 12
      anio = anio - 1
    }
  }
  return { mes, anio }
}

function getMesesPendientes(
  clienteId: string,
  primerMes: number,
  primerAnio: number,
  mesActual: number,
  anioActual: number,
  pagos: { mes: number | string; anio: number | string }[]
) {
  const pendientes: string[] = []
  let m = primerMes
  let a = primerAnio
  while (a < anioActual || (a === anioActual && m <= mesActual)) {
    const tienePago = pagos.some((p) => Number(p.mes) === m && Number(p.anio) === a)
    if (!tienePago) {
      pendientes.push(`${m.toString().padStart(2, '0')}/${a}`)
    }
    m++
    if (m > 12) {
      m = 1
      a++
    }
  }
  return pendientes
}

async function getClientesSinPagoDelMes(mesActual: number, anioActual: number) {
  const supabase = createServerSupabaseClient()

  // Obtener todos los clientes activos
  const { data: clientes, error: errorClientes } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, email, estado, plan, fecha_alta")
    .eq("estado", "activo")

  if (errorClientes || !clientes) return []

  // Para cada cliente, buscar todos sus pagos
  const clientesConPendientes = []
  for (const cliente of clientes) {
    const { data: pagos, error: errorPagos } = await supabase
      .from("pagos")
      .select("mes, anio")
      .eq("cliente_id", cliente.id)
    if (errorPagos) continue
    // Calcular desde el primer mes sin pago hasta el mes actual
    const fechaAltaStr = typeof cliente.fecha_alta === 'string' ? cliente.fecha_alta : ''
    const fechaAlta = new Date(fechaAltaStr)
    const primerMes = fechaAlta.getMonth() + 1
    const primerAnio = fechaAlta.getFullYear()
    const mesesPendientes = getMesesPendientes(
      String(cliente.id),
      primerMes,
      primerAnio,
      mesActual,
      anioActual,
      (pagos as { mes: number | string; anio: number | string }[]) || []
    )
    if (mesesPendientes.length > 0) {
      clientesConPendientes.push({ ...cliente, mesesPendientes })
    }
  }
  return clientesConPendientes
}

export default async function CortesPage() {
  // Calcular la fecha de referencia SOLO en el servidor
  const fechaReferencia = new Date()
  const { mes: mesActual, anio: anioActual } = getMesYAnoParaVerificarFromDate(fechaReferencia)
  const clientesMorosos = await getClientesSinPagoDelMes(mesActual, anioActual)

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
            Clientes sin pago del mes correspondiente
          </CardTitle>
          <CardDescription>Lista de clientes que no han registrado pago del mes actual o anterior según la fecha</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Meses pendientes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesMorosos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No hay clientes sin pago del mes correspondiente
                  </TableCell>
                </TableRow>
              ) : (
                clientesMorosos.map((cliente) => {
                  const id = typeof cliente.id === 'string' ? cliente.id : String(cliente.id ?? '')
                  const nombre = typeof cliente.nombre === 'string' ? cliente.nombre : '-'
                  const telefono = typeof cliente.telefono === 'string' ? cliente.telefono : '-'
                  const email = typeof cliente.email === 'string' ? cliente.email : '-'
                  const mesesPendientes = Array.isArray(cliente.mesesPendientes) ? cliente.mesesPendientes : []
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium">{nombre}</TableCell>
                      <TableCell>{telefono}</TableCell>
                      <TableCell>{email}</TableCell>
                      <TableCell>{mesesPendientes.join(", ")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/pagos/nuevo?cliente=${id}`}>Registrar Pago</Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/public/pagos/${id}`} target="_blank" rel="noopener noreferrer">Ver Historial</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
