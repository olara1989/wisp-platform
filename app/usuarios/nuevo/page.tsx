"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-provider"
import { createUsuario } from "../actions"

export default function NuevoUsuarioPage() {
  const { userRole } = useAuth();
  if (userRole !== "admin") {
    window.location.href = "/login";
    return null;
  }

  return (
    <DashboardLayout>
      <Card className="max-w-lg mx-auto mt-8">
        <CardHeader>
          <CardTitle>Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUsuario} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="rol">Rol</Label>
              <select id="rol" name="rol" className="border rounded px-2 py-2 w-full" required>
                <option value="admin">Administrador</option>
                <option value="tecnico">Técnico</option>
                <option value="cajero">Cajero</option>
              </select>
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">Crear Usuario</Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
} 