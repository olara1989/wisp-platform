"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface DashboardChartsProps {
  ingresosPorMes: { mes: string, monto: number }[]
  anio: number
  mes: number
  pieData: { name: string, value: number }[]
}

interface ClientesPorRegionChartProps {
  data: { region: string, cantidad: number }[]
}

interface ClientesPorAntenaChartProps {
  data: { antena: string, cantidad: number }[]
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const pieColors = ["#22c55e", "#facc15"]

export function DashboardCharts({ ingresosPorMes, anio, mes, pieData }: DashboardChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      {/* Gráfica de barras de ingresos mensuales */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Ingresos por mes ({anio})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ingresosPorMes}>
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#737373' }} />
                <YAxis tick={{ fontSize: 12, fill: '#737373' }} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="monto" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfica de pastel de clientes activos vs morosos */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Distribución de clientes ({MESES[mes-1]} {anio})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-72 flex items-center justify-center">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DashboardClientesPorRegionChart({ data }: ClientesPorRegionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
        <XAxis type="number" tick={{ fontSize: 12, fill: '#737373' }} allowDecimals={false} />
        <YAxis dataKey="region" type="category" tick={{ fontSize: 12, fill: '#737373' }} width={120} />
        <Tooltip formatter={(value: any) => value} />
        <Bar dataKey="cantidad" fill="#2563eb">
          <LabelList dataKey="cantidad" position="right" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DashboardClientesPorAntenaChart({ data }: ClientesPorAntenaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ left: 20, right: 20, top: 10, bottom: 40 }}>
        <XAxis 
          dataKey="antena" 
          tick={{ fontSize: 10, fill: '#737373' }} 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12, fill: '#737373' }} allowDecimals={false} />
        <Tooltip formatter={(value: any) => value} />
        <Bar dataKey="cantidad" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="cantidad" position="top" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
} 