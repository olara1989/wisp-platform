"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getEstadoColor } from "@/lib/utils"
import { createClientSupabaseClient } from "@/lib/supabase"

interface TableStatusSelectorProps {
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

export function TableStatusSelector({ clienteId, estadoActual, onStatusChange }: TableStatusSelectorProps) {
  const [estado, setEstado] = useState(estadoActual)
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    try {
      const { updateDoc, doc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      const clienteRef = doc(db, "clientes", clienteId)
      await updateDoc(clienteRef, { estado: newStatus })

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
    <Select
      value={estado}
      onValueChange={handleStatusChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[130px] h-8">
        <SelectValue>
          <Badge className={getEstadoColor(estado) + " px-2 py-0.5 text-xs font-medium rounded"}>
            {estado}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {estados.map((estado) => (
          <SelectItem key={estado} value={estado}>
            <Badge className={getEstadoColor(estado) + " px-2 py-0.5 text-xs font-medium rounded"}>
              {estado}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 