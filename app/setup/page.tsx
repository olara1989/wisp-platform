"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, Wifi } from "lucide-react"
import Link from "next/link"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const { toast } = useToast()

  const handleSetup = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setSetupComplete(true)
        toast({
          title: "Configuración completada",
          description: "El usuario de prueba ha sido configurado correctamente",
        })
      } else {
        throw new Error(data.error || "Error en la configuración")
      }
    } catch (error: any) {
      console.error("Setup error:", error)
      toast({
        title: "Error en la configuración",
        description: error.message || "No se pudo completar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle>WISP Manager</CardTitle>
            <CardDescription>Configuración inicial del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!setupComplete ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Configura el usuario de prueba para acceder a la aplicación por primera vez.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSetup} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    "Configurar Usuario de Prueba"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">¿Ya tienes una cuenta?</p>
                  <Button variant="link" asChild>
                    <Link href="/login">Iniciar sesión</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ¡Configuración completada! Ya puedes iniciar sesión.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Credenciales de acceso:</p>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p>
                      <strong>Email:</strong> admin@wisp.com
                    </p>
                    <p>
                      <strong>Contraseña:</strong> admin123
                    </p>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link href="/login">Ir al Login</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
