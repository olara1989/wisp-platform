import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import { Users, Package, CreditCard, AlertTriangle, Router } from "lucide-react"
import { cache } from "react"
import { redirect } from "next/navigation"
import { DashboardCharts, DashboardClientesPorRegionChart, DashboardClientesPorAntenaChart } from "@/components/DashboardCharts"
import { REGIONES } from "@/lib/types/regiones"
import type { ReadonlyURLSearchParams } from "next/navigation"

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

function getAnios() {
  const anioActual = new Date().getFullYear()
  const anioInicio = 2022
  const anios = []
  for (let a = anioInicio; a <= anioActual; a++) {
    anios.push(a)
  }
  return anios
}

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
    porcentajeMorosos: ((clientesResult.count || 0) ? (morososResult.count || 0) / (clientesResult.count || 0) * 100 : 0),
    clientesActivos: (clientesResult.count || 0) - (morososResult.count || 0),
    ticketPromedio: (clientesResult.count || 0) > 0 ? totalPagosMes / (clientesResult.count || 1) : 0,
  }
})

// Función para obtener clientes morosos según pagos del mes/año seleccionado
async function getClientesMorososPorMes(mes: number, anio: number) {
  const supabase = createServerSupabaseClient()
  // Obtener todos los clientes activos
  const { data: clientes, error: errorClientes } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, email, estado, plan, fecha_alta, region")
    .eq("estado", "activo")
  if (errorClientes || !clientes) return []

  // Obtener todos los pagos de ese mes/año
  const { data: pagos, error: errorPagos } = await supabase
    .from("pagos")
    .select("cliente_id")
    .eq("mes", mes)
    .eq("anio", anio)
  if (errorPagos || !pagos) return clientes // Si hay error, asume todos morosos

  const clientesQuePagaron = new Set(pagos.map(p => p.cliente_id))
  // Filtra los clientes que NO pagaron
  return clientes.filter(cliente => !clientesQuePagaron.has(cliente.id))
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  // Obtener mes y año de los query params o usar el actual
  const mesParam = Number(searchParams?.mes) || (new Date().getMonth() + 1);
  const anioParam = Number(searchParams?.anio) || new Date().getFullYear();
  const regionFiltro = searchParams?.region || "";

  // Calcular primer y último día del mes seleccionado
  const firstDayOfMonth = new Date(anioParam, mesParam - 1, 1).toISOString()
  const lastDayOfMonth = new Date(anioParam, mesParam, 0, 23, 59, 59, 999).toISOString()

  const supabase = createServerSupabaseClient()

  // Ejecutar consultas en paralelo para mejorar el rendimiento
  let clientesQuery = supabase.from("clientes").select("*", { count: "exact", head: true })
  let morososQuery = supabase.from("clientes").select("*", { count: "exact", head: true }).eq("estado", "moroso")
  
  if (regionFiltro) {
    clientesQuery = clientesQuery.eq("region", regionFiltro)
    morososQuery = morososQuery.eq("region", regionFiltro)
  }
  
  const [clientesResult, morososResult, planesResult, routersResult] = await Promise.all([
    clientesQuery,
    morososQuery,
    supabase.from("planes").select("*", { count: "exact", head: true }),
    supabase.from("routers").select("*", { count: "exact", head: true }),
  ])

  // Obtener suma de pagos del mes/año seleccionado
  let pagosQuery = supabase
    .from("pagos")
    .select("monto")
    .gte("fecha_pago", firstDayOfMonth)
    .lte("fecha_pago", lastDayOfMonth)
  
  if (regionFiltro) {
    pagosQuery = pagosQuery.eq("cliente_id", supabase.from("clientes").select("id").eq("region", regionFiltro))
  }
  
  const { data: pagosMes } = await pagosQuery

  const totalPagosMes = pagosMes?.reduce((sum, pago) => sum + Number(pago.monto), 0) || 0

  // Calcular clientes morosos según pagos del mes/año seleccionado
  const clientesMorosos = await getClientesMorososPorMes(mesParam, anioParam)
  const clientesMorososCount = clientesMorosos.length

  // Obtener total de clientes activos
  const clientesActivosCount = (clientesResult.count || 0) - clientesMorososCount

  // Actualizar stats
  const stats = {
    clientesCount: clientesResult.count || 0,
    clientesMorosos: clientesMorososCount,
    planesCount: planesResult.count || 0,
    routersCount: routersResult.count || 0,
    totalPagosMes,
    porcentajeMorosos: ((clientesResult.count || 0) ? clientesMorososCount / (clientesResult.count || 0) * 100 : 0),
    clientesActivos: clientesActivosCount,
    ticketPromedio: (clientesResult.count || 0) > 0 ? totalPagosMes / (clientesResult.count || 1) : 0,
  }

  // Obtener datos de ingresos por mes del año seleccionado
  const ingresosPorMes: { mes: string, monto: number }[] = []
  for (let m = 1; m <= 12; m++) {
    const firstDay = new Date(anioParam, m - 1, 1).toISOString()
    const lastDay = new Date(anioParam, m, 0, 23, 59, 59, 999).toISOString()
    // Consulta a la base de datos para cada mes
    // NOTA: Para optimización real, deberías hacer una sola consulta agrupada en SQL
    // Aquí lo hacemos secuencial por simplicidad SSR
    // eslint-disable-next-line no-await-in-loop
    let ingresosQuery = supabase
      .from("pagos")
      .select("monto, fecha_pago")
      .gte("fecha_pago", firstDay)
      .lte("fecha_pago", lastDay)
    
    if (regionFiltro) {
      ingresosQuery = ingresosQuery.eq("cliente_id", supabase.from("clientes").select("id").eq("region", regionFiltro))
    }
    
    const { data: pagosMes } = await ingresosQuery
    const total = pagosMes?.reduce((sum, pago) => sum + Number(pago.monto), 0) || 0
    ingresosPorMes.push({ mes: MESES[m - 1], monto: total })
  }

  // Obtener total de clientes activos (de la BD, no solo los que no son morosos)
  let clientesActivosQuery = supabase
    .from("clientes")
    .select("*", { count: "exact", head: true })
    .eq("estado", "activo")
  
  if (regionFiltro) {
    clientesActivosQuery = clientesActivosQuery.eq("region", regionFiltro)
  }
  
  const { count: totalClientesActivosBDCount, error: errorActivosBD } = await clientesActivosQuery
  const totalClientesActivosCount = totalClientesActivosBDCount ?? 0

  // Calcular total esperado del mes (suma de precios de planes de clientes activos)
  let clientesConPlanesQuery = supabase
    .from("clientes")
    .select(`
      id,
      plan,
      planes!inner(
        id,
        precio
      )
    `)
    .eq("estado", "activo")
    .not("plan", "is", null)
  
  if (regionFiltro) {
    clientesConPlanesQuery = clientesConPlanesQuery.eq("region", regionFiltro)
  }
  
  const { data: clientesConPlanes, error: errorClientesConPlanes } = await clientesConPlanesQuery

  let totalEsperado = 0
  if (clientesConPlanes && !errorClientesConPlanes) {
    totalEsperado = clientesConPlanes.reduce((sum: number, cliente: any) => {
      const precio = cliente.planes?.precio
      return sum + (precio ? Number(precio) : 0)
    }, 0)
  }

  // Datos para gráfica de pastel
  const pieData = [
    { name: "Activos", value: stats.clientesActivos },
    { name: "Morosos", value: stats.clientesMorosos },
  ]
  const pieColors = ["#22c55e", "#facc15"]

  // Obtener clientes por región
  const clientesPorRegion: { region: string, cantidad: number }[] = []
  for (const region of REGIONES) {
    const { data: clientesRegion, error: errorRegion } = await supabase
      .from("clientes")
      .select("id")
      .eq("estado", "activo")
      .eq("region", region.id)
    clientesPorRegion.push({ region: region.nombre, cantidad: clientesRegion?.length || 0 })
  }

  // Obtener distribución de clientes por tipo de antena
  const tiposAntena = [
    "LiteBeam M5", "LiteBeam M5 AC", "Loco M2", "Loco M5", "Loco M5 AC",
    "AirGrid", "PowerBeam M5", "PowerBeam M5 AC", "Cable Ethernet", 
    "Fibra Conversor", "Fibra Onu"
  ]
  
  const clientesPorAntena: { antena: string, cantidad: number }[] = []
  for (const antena of tiposAntena) {
    const { data: clientesAntena, error: errorAntena } = await supabase
      .from("clientes")
      .select("id")
      .eq("estado", "activo")
      .eq("antena", antena)
    clientesPorAntena.push({ antena, cantidad: clientesAntena?.length || 0 })
  }
  
  // Filtrar solo antenas que tienen clientes
  const antenasConClientes = clientesPorAntena.filter(item => item.cantidad > 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* Filtros de mes y año */}
        <form className="flex gap-4 mb-6 items-end" method="get">
          <div>
            <label className="block text-sm mb-1">Mes</label>
            <select name="mes" defaultValue={String(mesParam)} className="border rounded px-2 py-2 text-[#687373]">
              {MESES.map((mes, idx) => (
                <option key={mes} value={idx + 1}>{mes}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Año</label>
            <select name="anio" defaultValue={String(anioParam)} className="border rounded px-2 py-2 text-[#687373]">
              {getAnios().map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Región</label>
            <select name="region" defaultValue={regionFiltro} className="border rounded px-2 py-2 text-[#687373]">
              <option value="">Todas las regiones</option>
              {REGIONES.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.nombre}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="h-10 px-4 py-2 bg-primary text-white rounded">Consultar</button>
        </form>

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
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClientesActivosCount}</div>
              <p className="text-xs text-muted-foreground">Clientes con estado activo en la base de datos</p>
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
              <p className="text-xs text-muted-foreground">{MESES[mesParam-1]} {anioParam}</p>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">% Morosos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.porcentajeMorosos.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Porcentaje de clientes morosos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.ticketPromedio)}</div>
              <p className="text-xs text-muted-foreground">Ingreso promedio por cliente ({MESES[mesParam-1]} {anioParam})</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Esperado</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalEsperado)}</div>
              <p className="text-xs text-muted-foreground">Ingreso esperado del mes ({MESES[mesParam-1]} {anioParam})</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {/* Gráfica de clientes por región */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Clientes por región</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-72">
                <DashboardClientesPorRegionChart data={clientesPorRegion} />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Clientes por Tipo de Antena</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-72">
                <DashboardClientesPorAntenaChart data={antenasConClientes} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas del dashboard (barras y pastel) */}
        <DashboardCharts ingresosPorMes={ingresosPorMes} anio={anioParam} mes={mesParam} pieData={pieData} />
      </div>
    </DashboardLayout>
  )
}
