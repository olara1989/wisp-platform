/**
 * Componente Select para regiones
 * Utiliza shadcn/ui Select y maneja la selección de regiones
 */

"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { REGIONES, type Region } from "@/lib/types/regiones"

interface RegionSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * Componente Select para seleccionar regiones
 * 
 * @param value - Valor actual seleccionado
 * @param onValueChange - Callback cuando cambia la selección
 * @param placeholder - Texto placeholder del select
 * @param className - Clases CSS adicionales
 */
export function RegionSelect({
  value,
  onValueChange,
  placeholder = "Seleccionar región",
  className,
}: RegionSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {REGIONES.map((region) => (
          <SelectItem key={region.id} value={region.id}>
            {region.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 