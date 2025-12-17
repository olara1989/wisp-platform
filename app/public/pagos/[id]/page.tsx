import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { notFound } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"

const MESES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

function getMesesPendientes(primerMes, primerAnio, mesActual, anioActual, pagos) {
  const pendientes = []
  let m = primerMes
  let a = primerAnio
  while (a < anioActual || (a === anioActual && m <= mesActual)) {
    const tienePago = pagos.some((p) => Number(p.mes) === m && Number(p.anio) === a)
    if (!tienePago) {
      pendientes.push({ mes: m, anio: a })
    }
    m++
    if (m > 12) {
      m = 1
      a++
    }
  }
  return pendientes
}

export default async function PublicPagosPage({ params }: { params: { id: string } }) {
  // Obtener datos del cliente
  const clienteRef = doc(db, "clientes", params.id)
  const clienteSnap = await getDoc(clienteRef)

  if (!clienteSnap.exists()) {
    notFound()
  }

  const cliente = { id: clienteSnap.id, ...clienteSnap.data() }

  // Obtener pagos del cliente
  const pagosQuery = query(
    collection(db, "pagos"),
    where("cliente_id", "==", params.id)
  )
  const pagosSnap = await getDocs(pagosQuery)
  const pagos = pagosSnap.docs
    .map(doc => doc.data())
    .sort((a: any, b: any) => {
      // Sort by fecha_pago descending in memory
      if (!a.fecha_pago) return 1
      if (!b.fecha_pago) return -1
      return new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime()
    })

  // Obtener el plan para saber el monto de adeudo
  let precioPlan = 0
  if (cliente.plan) {
    const planRef = doc(db, "planes", cliente.plan)
    const planSnap = await getDoc(planRef)
    if (planSnap.exists()) {
      const planData = planSnap.data()
      if (planData && typeof planData.precio === 'number') {
        precioPlan = planData.precio
      }
    }
  }

  // Calcular meses pendientes
  const hoy = new Date()
  const mesActual = hoy.getMonth() + 1
  const anioActual = hoy.getFullYear()
  const fechaAlta = new Date(typeof cliente.fecha_alta === 'string' ? cliente.fecha_alta : '')
  const primerMes = fechaAlta.getMonth() + 1
  const primerAnio = fechaAlta.getFullYear()
  const mesesPendientes = getMesesPendientes(primerMes, primerAnio, mesActual, anioActual, pagos || [])

  // Asegurar que los datos sean string
  const nombre = typeof cliente.nombre === 'string' ? cliente.nombre : '-'
  const telefono = typeof cliente.telefono === 'string' ? cliente.telefono : '-'
  const email = typeof cliente.email === 'string' ? cliente.email : '-'
  const direccion = typeof cliente.direccion === 'string' ? cliente.direccion : '-'

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Datos del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><span className="font-semibold">Nombre:</span> {nombre}</div>
            <div><span className="font-semibold">Teléfono:</span> {telefono}</div>
            <div><span className="font-semibold">Email:</span> {email}</div>
            <div><span className="font-semibold">Dirección:</span> {direccion}</div>
          </div>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Meses Pendientes de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          {mesesPendientes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No hay adeudos pendientes</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mesesPendientes.map((mp, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{MESES[mp.mes]} / {mp.anio}</TableCell>
                    <TableCell>{formatCurrency(precioPlan)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {(!pagos || pagos.length === 0) ? (
            <div className="text-center py-6 text-muted-foreground">No hay pagos registrados para este cliente</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Mes</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((pago: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(pago.fecha_pago)}</TableCell>
                    <TableCell>{formatCurrency(pago.monto)}</TableCell>
                    <TableCell>{pago.metodo}</TableCell>
                    <TableCell>{MESES[Number(pago.mes)]} / {pago.anio}</TableCell>
                    <TableCell>{pago.notas || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="text-center text-sm text-muted-foreground mt-4">
        <strong>Importante:</strong> Los pagos deben efectuarse antes del día 5 de cada mes. El servicio es <strong>prepago</strong> y el no pago oportuno puede causar suspensión del servicio.
      </div>
    </div>
  )
} 