"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { Loader2 } from "lucide-react"

export default function UsuariosPage() {
  const { userRole, isLoading, user } = useAuth()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!isLoading && userRole !== "admin") {
      // redirect handled by AuthProvider or manual here
      router.push("/dashboard") // or login
    }
  }, [userRole, isLoading, router])

  useEffect(() => {
    const fetchUsuarios = async () => {
      if (userRole !== "admin") return;
      setLoadingData(true)
      try {
        const q = query(collection(db, "usuarios"))
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        setUsuarios(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingData(false)
      }
    }
    fetchUsuarios()
  }, [userRole])

  if (isLoading || (loadingData && userRole === "admin")) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
      </DashboardLayout>
    )
  }

  if (userRole !== "admin") return null;

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Button asChild>
          <Link href="/usuarios/nuevo">Nuevo Usuario</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Usuarios registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios?.map((usuario: any) => (
                <TableRow key={usuario.id}>
                  <TableCell>{usuario.nombre}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.rol}</TableCell>
                  <TableCell>{usuario.created_at?.seconds ? new Date(usuario.created_at.seconds * 1000).toLocaleDateString() : usuario.created_at}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/usuarios/${usuario.id}/editar`}>Editar</Link>
                    </Button>
                    <Button asChild size="sm" variant="destructive">
                      <Link href={`/usuarios/${usuario.id}/eliminar`}>Eliminar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
