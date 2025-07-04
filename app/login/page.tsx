"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, Loader2, Info } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("admin@wisp.com")
  const [password, setPassword] = useState("admin123")
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, userRole } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido a WISP Manager",
      })
    } catch (error: any) {
      console.error("Login error:", error)
      let mensaje = "Error desconocido. Intenta de nuevo."
      if (error?.status === 400) {
        mensaje = "Correo o contraseña incorrectos."
      } else if (error?.status === 429) {
        mensaje = "Demasiados intentos. Espera un momento e inténtalo de nuevo."
      } else if (error?.message?.toLowerCase().includes("user not found")) {
        mensaje = "Usuario no encontrado."
      } else if (error?.message?.toLowerCase().includes("invalid login credentials")) {
        mensaje = "Correo o contraseña incorrectos."
      } else if (error?.message?.toLowerCase().includes("email not confirmed")) {
        mensaje = "Debes confirmar tu correo electrónico antes de iniciar sesión."
      } else if (error?.message) {
        mensaje = error.message
      }
      toast({
        title: "Error de inicio de sesión",
        description: mensaje,
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
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
              <Wifi className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl text-center">WISP Manager</CardTitle>
            <CardDescription className="text-center">Inicia sesión para acceder a la plataforma</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  )
}
