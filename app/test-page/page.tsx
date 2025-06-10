"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TestPage() {
  const { user, userRole, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useState(() => {
    setMounted(true)
  })

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Página de Prueba</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p>
              <strong>Usuario:</strong> {user?.email || "No autenticado"}
            </p>
            <p>
              <strong>Rol:</strong> {userRole || "N/A"}
            </p>
            <p>
              <strong>Loading:</strong> {isLoading ? "Sí" : "No"}
            </p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/clientes">Ir a Clientes</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/clientes/nuevo">Ir a Nuevo Cliente</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/debug">Ir a Debug</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
