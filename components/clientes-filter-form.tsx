"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelectRegionFilter } from "@/components/ui/multi-select-region-filter"

interface ClientesFilterFormProps {
  uniqueRegions: string[]
}

export function ClientesFilterForm({ uniqueRegions }: ClientesFilterFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [estado, setEstado] = useState(searchParams.get("estado") || "todos")
  const [buscar, setBuscar] = useState(searchParams.get("buscar") || "")
  // No necesitamos un estado para las regiones aquí, ya que MultiSelectRegionFilter lo maneja internamente

  // Sincronizar el estado interno con los search params si cambian externamente
  useEffect(() => {
    setEstado(searchParams.get("estado") || "todos")
    setBuscar(searchParams.get("buscar") || "")
  }, [searchParams])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      // Asegurarse de que el parámetro 'region' no se borre accidentalmente
      return params.toString()
    },
    [searchParams]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())

    if (estado && estado !== "todos") {
      params.set("estado", estado)
    } else {
      params.delete("estado")
    }

    if (buscar) {
      params.set("buscar", buscar)
    } else {
      params.delete("buscar")
    }

    // Las regiones ya son manejadas por MultiSelectRegionFilter directamente en la URL

    router.push(`?${params.toString()}`)
  }

  return (
    <form className="flex flex-col sm:flex-row gap-4" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select name="estado" value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="moroso">Moroso</SelectItem>
            <SelectItem value="suspendido">Suspendido</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <MultiSelectRegionFilter options={uniqueRegions} />
      </div>

      <div className="flex-1 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          name="buscar"
          placeholder="Buscar por nombre, email o teléfono"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="flex-1"
        />
      </div>

      <Button type="submit">Aplicar Filtros</Button>
    </form>
  )
} 