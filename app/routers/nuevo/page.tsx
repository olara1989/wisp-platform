"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase"
import { testRouterConnection } from "@/lib/mikrotik"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"

export default function NuevoRouterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    ip: "",
    usuario: "",
    password: "",
    puerto_api: "8728",
    modo_control: "queue",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTestConnection = async () => {
    if (!formData.ip || !formData.usuario || !formData.password) {
      toast({
        title: "Datos incompletos",
        description: "Por favor ingresa IP, usuario y contraseña para probar la conexión",
        variant: "destructive",
      })
      return
    }

    setIsTesting(true)

    try {
      await testRouterConnection(formData.ip, formData.usuario, formData.password, Number.parseInt(formData.puerto_api))

      toast({
        title: "Conexión exitosa",
        description: "Se ha establecido conexión con el router Mikrotik",
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: "Error de conexión",
        description: error.message || "No se pudo conectar al router Mikrotik",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase
        .from("routers")
        .insert({
          ...formData,
          puerto_api: Number.parseInt(formData.puerto_api),
        })
        .select()

      if (error) {
        throw error
      }

      toast({
        title: "Router configurado",
        description: "El router ha sido configurado exitosamente",
      })

      router.push("/routers")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al configurar el router",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/routers">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Nuevo Router Mikrotik</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Configuración del Router</CardTitle>
            <CardDescription>Ingresa los datos de conexión al router Mikrotik</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Router</Label>
                <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ip">Dirección IP</Label>
                <Input id="ip" name="ip" value={formData.ip} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuario</Label>
                <Input id="usuario" name="usuario" value={formData.usuario} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="puerto_api">Puerto API</Label>
                <Input
                  id="puerto_api"
                  name="puerto_api"
                  type="number"
                  value={formData.puerto_api}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modo_control">Modo de Control</Label>
                <Select
                  value={formData.modo_control}
                  onValueChange={(value) => handleSelectChange("modo_control", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="queue">Simple Queue</SelectItem>
                    <SelectItem value="address-list">Address List</SelectItem>
                    <SelectItem value="pppoe">PPPoE</SelectItem>
                    <SelectItem value="firewall">Firewall</SelectItem>
                    <SelectItem value="hotspot">Hotspot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Probando conexión...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Probar Conexión
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/routers">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Router"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </DashboardLayout>
  )
}
