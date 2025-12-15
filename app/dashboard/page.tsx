"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Users, Package, CreditCard, AlertTriangle, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardCharts, DashboardClientesPorRegionChart, DashboardClientesPorAntenaChart } from "@/components/DashboardCharts"
import { REGIONES } from "@/lib/types/regiones"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, Timestamp, orderBy } from "firebase/firestore"

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

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Params
  const mesParam = Number(searchParams.get("mes")) || (new Date().getMonth() + 1)
  const anioParam = Number(searchParams.get("anio")) || new Date().getFullYear()
  const regionFiltro = searchParams.get("region") || ""

  // State
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    clientesCount: 0,
    clientesMorosos: 0,
    planesCount: 0,
    routersCount: 0,
    totalPagosMes: 0,
    porcentajeMorosos: 0,
    clientesActivos: 0,
    ticketPromedio: 0,
    totalEsperado: 0
  })

  const [pieData, setPieData] = useState<{ name: string, value: number }[]>([])
  const [clientesPorRegion, setClientesPorRegion] = useState<{ region: string, cantidad: number }[]>([])
  const [clientesPorAntena, setClientesPorAntena] = useState<{ antena: string, cantidad: number }[]>([])
  const [ingresosPorMes, setIngresosPorMes] = useState<{ mes: string, monto: number }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 1. Fetch Basic Collections
        // Use Client SDK. For large datasets, server-side aggregation is better, 
        // but we are sticking to Client SDK as per migration validation.

        // Fetch Routers
        const routersSnap = await getDocs(collection(db, "routers"))
        const routersCount = routersSnap.size

        // Fetch Planes
        const planesSnap = await getDocs(collection(db, "planes"))
        const planesCount = planesSnap.size
        const planesMap = new Map()
        planesSnap.forEach(doc => planesMap.set(doc.id, doc.data().precio))

        // Fetch Clientes (ALL)
        // We need all to calculate stats, filter by region locally if needed or in query
        // If filtering by region, we can optimize query
        let clientesQuery = collection(db, "clientes")
        let clientesSnap

        // Firestore doesn't support dynamic complex filters easily without indexes. 
        // We'll fetch all and filter in memory for complex logic like "active & region" if dataset is small (< few thousands)
        // For rigorous region filtering:
        if (regionFiltro) {
          const q = query(collection(db, "clientes"), where("region", "==", regionFiltro))
          clientesSnap = await getDocs(q)
        } else {
          clientesSnap = await getDocs(collection(db, "clientes"))
        }

        const clientes = clientesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))

        const clientesCount = clientes.length
        const clientesActivosDB = clientes.filter(c => c.estado === "activo")
        const clientesActivosCountDB = clientesActivosDB.length

        // Total Esperado (Sum of plan prices for active clients)
        const totalEsperado = clientesActivosDB.reduce((sum, client) => {
          const precio = client.plan ? planesMap.get(client.plan) : 0
          return sum + (precio ? Number(precio) : 0)
        }, 0)

        // Fetch Pagos (Month & Year)
        // We need payments for the selected Month/Year to calc Income & Morosos
        // Firestore dates are timestamps or strings depending on migration. Assuming strings "YYYY-MM-DD" or similar based on previous files,
        // OR checks on `mes` and `anio` fields if they exist in `pagos`.
        // The previous code used: .eq("mes", mes).eq("anio", anio) for morosos
        // And date range for amounts.
        // Let's check `pagos` structure from `route` or previous files. `pagos` has `mes` and `anio` stored as numbers/strings?
        // `api/cortes/route.ts` implies `pagos` has `mes` and `anio`.
        // `dashboard/page.tsx` used `fecha_pago` range for amounts. 
        // We will use `fecha_pago` range for amounts and `mes`/`anio` fields if available for logic reliability.
        // Actually, if we use `fecha_pago`, we can derive mes/anio.
        // Let's stick to `fecha_pago` for consistency with "payments made in this period".

        // Range for selected month
        // Note: Use string comparison if stored as ISO string, or Timestamp if stored as timestamp.
        // Based on `app/dashboard/page.tsx` L45: `.gte("fecha_pago", firstDayOfMonth)`
        const firstDayOfMonth = new Date(anioParam, mesParam - 1, 1).toISOString()
        const lastDayOfMonth = new Date(anioParam, mesParam, 0, 23, 59, 59, 999).toISOString()

        // Fetch payments for stats
        const pagosRef = collection(db, "pagos")
        // We need payments for the month to sum amount
        const qPagosMes = query(pagosRef, where("fecha_pago", ">=", firstDayOfMonth), where("fecha_pago", "<=", lastDayOfMonth))
        const pagosMesSnap = await getDocs(qPagosMes)

        let totalPagosMes = 0
        const clientIdsPaidThisMonth = new Set()

        pagosMesSnap.forEach((doc) => {
          const p = doc.data()
          // Filter by region if needed (requires fetching client for each payment or filtering payments by client ids)
          // Since we have `clientes` loaded, we can check.
          const cliente = clientes.find(c => c.id === p.cliente_id)
          if (!regionFiltro || (cliente && cliente.region === regionFiltro)) {
            totalPagosMes += Number(p.monto)
            clientIdsPaidThisMonth.add(p.cliente_id)
          }
        })

        // Morosos Calculation
        // Active clients who haven't paid in this month (based on logic: getClientesMorososPorMes uses pagos with mes/anio columns)
        // If filtering by date range of payment matches "paying for that month", we use that.
        // Ideally, `pagos` has `mes` and `anio` fields representing the COVERED period, independent of `fecha_pago`.
        // Let's assume we should query `pagos` where `mes` == mesParam and `anio` == anioParam for Morosos check.
        const qPagosPeriod = query(pagosRef, where("mes", "==", mesParam.toString()), where("anio", "==", anioParam.toString())) // assuming string/number match
        // Try matching formats. In `api/cortes`, it casts to Number. In Firestore it might be string/number.
        // We'll fetch all payments for that client if necessary or just this query.
        // Safe bet: Fetch payments with `mes` and `anio`.
        // BUT: If `mes` is number in DB, string query might fail.
        // For now, let's assume we can rely on `clientIdsPaidThisMonth` derived from `fecha_pago` OR fetch specifically for period coverage if `mes` field exists.
        // Re-reading `dashboard/page.tsx`:
        // getClientesMorososPorMes uses `.eq("mes", mes).eq("anio", anio)`.
        // So we should do that.

        // Since we can't be sure of data types (number vs string) and mixed usage, 
        // AND we can't easily do OR queries for types.
        // We will fetch all payments that *could* match (e.g. all payments for valid clients) or just rely on the query if we assume type consistency.
        // Let's try querying by `mes` (as number and string?) or just assume it matches param type.
        // `mesParam` is number.

        let pagosPeriodSnap = await getDocs(query(pagosRef, where("mes", "==", mesParam), where("anio", "==", anioParam)))
        if (pagosPeriodSnap.empty) {
          // Try string
          pagosPeriodSnap = await getDocs(query(pagosRef, where("mes", "==", String(mesParam)), where("anio", "==", String(anioParam))))
        }

        const clientIdsCovered = new Set()
        pagosPeriodSnap.forEach(doc => {
          clientIdsCovered.add(doc.data().cliente_id)
        })

        const clientesMorosos = clientesActivosDB.filter(c => !clientIdsCovered.has(c.id))
        const clientesMorososCount = clientesMorosos.length

        // Stats Aggregation
        const ticketPromedio = clientesCount > 0 ? totalPagosMes / clientesCount : 0

        // Charts Data
        // 1. Pie (Activos vs Morosos in DB context? Or Active vs Suspended?)
        // Dashboard used: Activos (calculated as Total - Morosos) vs Morosos
        const pieDataCalc = [
          { name: "Activos", value: clientesCount - clientesMorososCount },
          { name: "Morosos", value: clientesMorososCount },
        ]

        // 2. Clientes por Region
        const regionStats = REGIONES.map(r => {
          const count = clientesActivosDB.filter(c => c.region === r.id).length
          return { region: r.nombre, cantidad: count }
        })

        // 3. Clientes por Antena
        const tiposAntena = [
          "LiteBeam M5", "LiteBeam M5 AC", "Loco M2", "Loco M5", "Loco M5 AC",
          "AirGrid", "PowerBeam M5", "PowerBeam M5 AC", "Cable Ethernet",
          "Fibra Conversor", "Fibra Onu"
        ]
        const antenaStats = tiposAntena.map(a => {
          const count = clientesActivosDB.filter(c => c.antena === a).length
          return { antena: a, cantidad: count }
        }).filter(item => item.cantidad > 0)

        // 4. Ingresos Por Mes (Annual)
        // This requires fetching payments for the whole year.
        const startYear = new Date(anioParam, 0, 1).toISOString()
        const endYear = new Date(anioParam, 11, 31, 23, 59, 59).toISOString()
        const qPagosYear = query(pagosRef, where("fecha_pago", ">=", startYear), where("fecha_pago", "<=", endYear))
        const pagosYearSnap = await getDocs(qPagosYear)

        const ingresosMap = new Array(12).fill(0)
        pagosYearSnap.forEach(doc => {
          const p = doc.data()
          // Apply region filter if needed
          const cliente = clientes.find(c => c.id === p.cliente_id)
          if (!regionFiltro || (cliente && cliente.region === regionFiltro)) {
            const d = new Date(p.fecha_pago)
            ingresosMap[d.getMonth()] += Number(p.monto)
          }
        })

        const ingresosChartData = ingresosMap.map((monto, idx) => ({
          mes: MESES[idx],
          monto
        }))

        setStats({
          clientesCount,
          clientesMorosos: clientesMorososCount,
          planesCount,
          routersCount,
          totalPagosMes,
          porcentajeMorosos: clientesCount ? (clientesMorososCount / clientesCount) * 100 : 0,
          clientesActivos: clientesActivosCountDB, // Actual DB Status 'activo'
          ticketPromedio,
          totalEsperado
        })
        setPieData(pieDataCalc)
        setClientesPorRegion(regionStats)
        setClientesPorAntena(antenaStats)
        setIngresosPorMes(ingresosChartData)


      } catch (error) {
        console.error("Dashboard Fetch Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [mesParam, anioParam, regionFiltro, router])

  const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams(searchParams)
    params.set("mes", formData.get("mes") as string)
    params.set("anio", formData.get("anio") as string)
    params.set("region", formData.get("region") as string)
    router.push(`?${params.toString()}`)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* Filtros de mes y año */}
        <form className="flex gap-4 mb-6 items-end" onSubmit={handleFilter}>
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
              <div className="text-2xl font-bold">{stats.clientesActivos}</div>
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
              <p className="text-xs text-muted-foreground">{MESES[mesParam - 1]} {anioParam}</p>
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
              <p className="text-xs text-muted-foreground">Ingreso promedio por cliente ({MESES[mesParam - 1]} {anioParam})</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Esperado</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEsperado)}</div>
              <p className="text-xs text-muted-foreground">Ingreso esperado del mes ({MESES[mesParam - 1]} {anioParam})</p>
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
                <DashboardClientesPorAntenaChart data={clientesPorAntena} />
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
