import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createServerSupabaseClient } from "@/lib/supabase"
import { formatCurrency, formatDate, getEstadoPagoColor } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"
import { CreditCard, History, MessageCircle } from "lucide-react"
import { useMemo } from "react"
import { REGIONES } from "@/lib/types/regiones"
import { RegionSelect } from "@/components/ui/region-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { redirect } from "next/navigation"

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
    .select("id, nombre, telefono, email, estado, plan, fecha_alta, region")
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

export default async function CortesPage({ searchParams }: { searchParams?: { [key: string]: string } }) {
  // Filtros desde la URL
  const regionFiltro = searchParams?.region || ""
  const mesesFiltro = Number(searchParams?.meses) || 0

  // Obtén la fecha de referencia como string ISO (solo en el servidor)
  const fechaReferenciaISO = new Date().toISOString()
  const fechaReferencia = new Date(fechaReferenciaISO)
  const { mes: mesActual, anio: anioActual } = getMesYAnoParaVerificarFromDate(fechaReferencia)
  let clientesMorosos = await getClientesSinPagoDelMes(mesActual, anioActual)

  // Filtrar por región si aplica
  if (regionFiltro) {
    clientesMorosos = clientesMorosos.filter((c: any) => c.region === regionFiltro)
  }
  // Filtrar por número de meses pendientes si aplica
  if (mesesFiltro > 0) {
    clientesMorosos = clientesMorosos.filter((c: any) => Array.isArray(c.mesesPendientes) && c.mesesPendientes.length === mesesFiltro)
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Cortes Pendientes</h1>
        <Badge variant="outline" className="ml-2">
          {clientesMorosos.length} clientes
        </Badge>
      </div>

      {/* Filtros */}
      <form className="flex flex-wrap gap-4 mb-6 items-end" method="get">
        <div>
          <label className="block text-sm mb-1">Región</label>
          <select
            name="region"
            defaultValue={regionFiltro}
            className="w-[180px] border rounded px-2 py-2 text-[#737373]"
          >
            <option value="">Todas las regiones</option>
            {REGIONES.map((region) => (
              <option key={region.id} value={region.id}>
                {region.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Meses pendientes</label>
          <select
            name="meses"
            defaultValue={mesesFiltro ? String(mesesFiltro) : ""}
            className="w-[140px] border rounded px-2 py-2 text-[#737373]"
          >
            <option value="">Todos</option>
            {[1,2,3,4,5,6].map((n) => (
              <option key={n} value={n}>{n} mes{n > 1 ? "es" : ""}</option>
            ))}
          </select>
        </div>
        <Button type="submit" className="h-10">Aplicar filtros</Button>
      </form>

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
                  const linkHistorial = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/public/pagos/${id}`
                  const mensaje = encodeURIComponent(
                    `Hola ${nombre}, te recordamos que tienes pagos pendientes correspondientes a los meses: ${mesesPendientes.join(", ")}.\n\nPor favor regulariza tu pago antes del día 5 de cada mes para evitar cortes en el servicio y multas por pago tardío.\n\nPuedes consultar tu historial de pagos aquí: ${linkHistorial}\n\nPuedes comunicarte con nosotros para más información.`
                  )
                  const whatsappUrl = telefono && telefono !== '-' ? `https://wa.me/${telefono.replace(/[^\d]/g, '')}?text=${mensaje}` : null
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium">{nombre}</TableCell>
                      <TableCell>{telefono}</TableCell>
                      <TableCell>{email}</TableCell>
                      <TableCell>{mesesPendientes.join(", ")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/pagos/nuevo?cliente=${id}`} title="Registrar Pago">
                              <CreditCard className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/public/pagos/${id}`} target="_blank" rel="noopener noreferrer" title="Ver Historial">
                              <History className="w-4 h-4" />
                            </Link>
                          </Button>
                          {whatsappUrl && (
                            <Button variant="secondary" size="sm" asChild>
                              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="Enviar WhatsApp">
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
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
