"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getEstadoColor } from "@/lib/utils"
import { createClientSupabaseClient } from "@/lib/supabase"

interface StatusSelectorProps {
  clienteId: string
  estadoActual: string
  onStatusChange?: (newStatus: string) => void
}

const estados = [
  "activo",
  "cortado",
  "recoger equipo",
  "pausado",
  "suspendido"
] as const

export function StatusSelector({ clienteId, estadoActual, onStatusChange }: StatusSelectorProps) {
  const [estado, setEstado] = useState(estadoActual)
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    try {
      const supabase = createClientSupabaseClient()
      const { error } = await supabase
        .from("clientes")
        .update({ estado: newStatus })
        .eq("id", clienteId)

      if (error) throw error

      setEstado(newStatus)
      if (onStatusChange) {
        onStatusChange(newStatus)
      }
    } catch (error) {
      console.error("Error al actualizar el estado:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={estado}
        onValueChange={handleStatusChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <Badge className={getEstadoColor(estado) + " px-2 py-1 text-sm font-medium rounded"}>
              {estado}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {estados.map((estado) => (
            <SelectItem key={estado} value={estado}>
              <Badge className={getEstadoColor(estado) + " px-2 py-1 text-sm font-medium rounded"}>
                {estado}
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 