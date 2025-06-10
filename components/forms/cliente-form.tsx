/**
 * Formulario para crear/editar clientes
 * Incluye el select de regiones como ejemplo de uso
 */

"use client"

import { useState } from "react"
import { RegionSelect } from "@/components/ui/region-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ClienteFormProps {
  onSubmit: (data: ClienteFormData) => void
  initialData?: Partial<ClienteFormData>
}

export interface ClienteFormData {
  nombre: string
  apellido: string
  email: string
  telefono: string
  regionId: string
  direccion: string
}

/**
 * Formulario para gestionar datos de clientes
 * 
 * @param onSubmit - Función que se ejecuta al enviar el formulario
 * @param initialData - Datos iniciales para edición
 */
export function ClienteForm({ onSubmit, initialData }: ClienteFormProps) {
  const [formData, setFormData] = useState<ClienteFormData>({
    nombre: initialData?.nombre || "",
    apellido: initialData?.apellido || "",
    email: initialData?.email || "",
    telefono: initialData?.telefono || "",
    regionId: initialData?.regionId || "",
    direccion: initialData?.direccion || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos del Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Región</Label>
            <RegionSelect
              value={formData.regionId}
              onValueChange={(value) => setFormData({ ...formData, regionId: value })}
              placeholder="Seleccione una región"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            {initialData ? "Actualizar Cliente" : "Crear Cliente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 