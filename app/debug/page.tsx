"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClientSupabaseClient } from "@/lib/supabase"
import Link from "next/link"

export default function DebugPage() {
  const { user, userRole, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [supabaseStatus, setSupabaseStatus] = useState<string>("Checking...")

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const supabase = createClientSupabaseClient()
        const { data, error } = await supabase.from("clientes").select("count").limit(1)

        if (error) {
          setSupabaseStatus(`Error: ${error.message}`)
        } else {
          setSupabaseStatus("Connected ✓")
        }
      } catch (error: any) {
        setSupabaseStatus(`Error: ${error.message}`)
      }
    }

    checkSupabase()
  }, [])

  const testRoute = (route: string) => {
    console.log(`Testing route: ${route}`)
    router.push(route)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug - Estado de la Aplicación</CardTitle>
            <CardDescription>Información de debugging para verificar el estado de la aplicación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Estado Actual</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Ruta actual:</span>
                  <Badge variant="outline">{pathname}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Loading:</span>
                  <Badge variant={isLoading ? "destructive" : "default"}>{isLoading ? "Sí" : "No"}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Usuario:</span>
                  <Badge variant={user ? "default" : "destructive"}>{user ? "Autenticado" : "No autenticado"}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Email:</span>
                  <span className="text-sm text-muted-foreground">{user?.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Rol:</span>
                  <Badge variant="outline">{userRole || "N/A"}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Supabase:</span>
                  <Badge variant={supabaseStatus.includes("Error") ? "destructive" : "default"}>{supabaseStatus}</Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Variables de Entorno</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                  <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "default" : "destructive"}>
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurada" : "No configurada"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                  <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "default" : "destructive"}>
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configurada" : "No configurada"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pruebas de Navegación</CardTitle>
            <CardDescription>Prueba las rutas principales de la aplicación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Button onClick={() => testRoute("/dashboard")} variant="outline" size="sm">
                Dashboard
              </Button>
              <Button onClick={() => testRoute("/clientes")} variant="outline" size="sm">
                Clientes
              </Button>
              <Button onClick={() => testRoute("/clientes/nuevo")} variant="outline" size="sm">
                Nuevo Cliente
              </Button>
              <Button onClick={() => testRoute("/planes")} variant="outline" size="sm">
                Planes
              </Button>
              <Button onClick={() => testRoute("/pagos")} variant="outline" size="sm">
                Pagos
              </Button>
              <Button onClick={() => testRoute("/routers")} variant="outline" size="sm">
                Routers
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/test-connection">Probar Conexión a Supabase</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/setup">Ir a Setup</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Ir a Login</Link>
            </Button>
            <Button
              onClick={() => {
                console.log("Current state:", { user, userRole, isLoading, pathname })
                console.log("Environment:", {
                  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                  hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                })
              }}
              variant="secondary"
              className="w-full"
            >
              Log State to Console
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
