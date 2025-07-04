"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, getEstadoPagoColor } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"
import { CreditCard, History, MessageCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { REGIONES } from "@/lib/types/regiones"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSearchParams } from "next/navigation"

interface ClienteMoroso {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  plan: string;
  fecha_alta: string;
  region: string;
  mesesPendientes: string[];
}

export default function CortesPage() {
  const searchParams = useSearchParams();
  const [clientesMorosos, setClientesMorosos] = useState<ClienteMoroso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const regionFiltro = searchParams?.get("region") || "";
  const mesesFiltro = Number(searchParams?.get("meses")) || 0;

  useEffect(() => {
    const fetchCortes = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (regionFiltro) params.append("region", regionFiltro);
        if (mesesFiltro > 0) params.append("meses", String(mesesFiltro));

        const response = await fetch(`/api/cortes?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al cargar los clientes morosos");
        }
        const data: ClienteMoroso[] = await response.json();
        setClientesMorosos(data);
      } catch (err: any) {
        console.error("Error fetching cortes data:", err);
        setError(err.message || "No se pudieron cargar los datos de cortes.");
      } finally {
        setLoading(false);
      }
    };

    fetchCortes();
  }, [regionFiltro, mesesFiltro]);

  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Cortes Pendientes</h1>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <Badge variant="outline" className="ml-2">
            {clientesMorosos.length} clientes
          </Badge>
        )}
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
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} mes{n > 1 ? "es" : ""}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="h-10">Aplicar filtros</Button>
      </form>

      {error && (
        <div className="text-red-500 mb-4">Error: {error}</div>
      )}

      {loading && clientesMorosos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
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
                    const id = typeof cliente.id === 'string' ? cliente.id : String(cliente.id ?? '');
                    const nombre = typeof cliente.nombre === 'string' ? cliente.nombre : '-';
                    const telefono = typeof cliente.telefono === 'string' ? cliente.telefono : '-';
                    const email = typeof cliente.email === 'string' ? cliente.email : '-';
                    const mesesPendientes = Array.isArray(cliente.mesesPendientes) ? cliente.mesesPendientes : [];
                    const linkHistorial = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/public/pagos/${id}`;
                    const mensaje = encodeURIComponent(
                      `Hola ${nombre}, te recordamos que tienes pagos pendientes correspondientes a los meses: ${mesesPendientes.join(", ")}.\n\nPor favor regulariza tu pago antes del día 5 de cada mes para evitar cortes en el servicio y multas por pago tardío.\n\nPuedes consultar tu historial de pagos aquí: ${linkHistorial}\n\nPuedes comunicarte con nosotros para más información.`
                    );
                    const whatsappUrl = telefono && telefono !== '-' ? `https://wa.me/${telefono.replace(/[^\d]/g, '')}?text=${mensaje}` : null;
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
