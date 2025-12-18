"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function EditarUsuarioPage({ params }: { params: { id: string } }) {
  const { userRole, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [usuario, setUsuario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && userRole !== "admin") {
      router.push("/dashboard")
    }
  }, [userRole, authLoading, router])

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const docRef = doc(db, "usuarios", params.id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUsuario({ id: docSnap.id, ...docSnap.data() })
        } else {
          toast({
            title: "Error",
            description: "Usuario no encontrado",
            variant: "destructive",
          })
          router.push("/usuarios")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userRole === "admin") {
      fetchUsuario()
    }
  }, [params.id, userRole, router, toast])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const nombre = formData.get("nombre") as string
    const email = formData.get("email") as string
    const rol = formData.get("rol") as string

    try {
      const docRef = doc(db, "usuarios", params.id)
      await updateDoc(docRef, { nombre, email, rol })
      toast({
        title: "Éxito",
        description: "Usuario actualizado correctamente",
      })
      router.push("/usuarios")
      router.refresh()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (userRole !== "admin" || !usuario) return null

  return (
    <DashboardLayout>
      <Card className="max-w-lg mx-auto mt-8">
        <CardHeader>
          <CardTitle>Editar Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" defaultValue={usuario.nombre} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={usuario.email} required />
            </div>
            <div>
              <Label htmlFor="rol">Rol</Label>
              <select
                id="rol"
                name="rol"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue={usuario.rol}
                required
              >
                <option value="admin">Administrador</option>
                <option value="tecnico">Técnico</option>
                <option value="cajero">Cajero</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
