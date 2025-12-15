"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, orderBy, query } from "firebase/firestore"

interface Router {
  id: string
  nombre: string
  ip: string
  puerto_api: number
  modo_control: string
}

export default function RoutersPage() {
  const [routers, setRouters] = useState<Router[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRouters = async () => {
      try {
        const q = query(collection(db, "routers"), orderBy("nombre"))
        const querySnapshot = await getDocs(q)
        const routersData: Router[] = []
        querySnapshot.forEach((doc) => {
          routersData.push({ id: doc.id, ...doc.data() } as Router)
        })
        setRouters(routersData)
      } catch (error) {
        console.error("Error al obtener routers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRouters()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Routers Mikrotik</h1>
        <Button asChild>
          <Link href="/routers/nuevo">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Router
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Routers Configurados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Puerto API</TableHead>
                <TableHead>Modo Control</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No hay routers configurados
                  </TableCell>
                </TableRow>
              ) : (
                routers.map((router) => (
                  <TableRow key={router.id}>
                    <TableCell className="font-medium">{router.nombre}</TableCell>
                    <TableCell>{router.ip}</TableCell>
                    <TableCell>{router.puerto_api || 8728}</TableCell>
                    <TableCell>{router.modo_control}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/routers/${router.id}`}>Editar</Link>
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
