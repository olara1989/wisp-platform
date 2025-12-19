"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelectRegionFilter } from "@/components/ui/multi-select-region-filter"
import { Badge } from "@/components/ui/badge"
import { getEstadoColor } from "@/lib/utils"

interface ClientesFilterFormProps {
  uniqueRegions: string[]
}

const estados = [
  "activo",
  "cortado",
  "recoger equipo",
  "pausado",
  "suspendido"
] as const

export function ClientesFilterForm({ uniqueRegions }: ClientesFilterFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [estado, setEstado] = useState(searchParams.get("estado") || "activo")
  const [buscar, setBuscar] = useState(searchParams.get("buscar") || "")

  useEffect(() => {
    setEstado(searchParams.get("estado") || "activo")
    setBuscar(searchParams.get("buscar") || "")
  }, [searchParams])

  const handleEstadoChange = (newEstado: string) => {
    setEstado(newEstado)
    const params = new URLSearchParams(searchParams.toString())

    if (newEstado && newEstado !== "todos") {
      params.set("estado", newEstado)
    } else {
      params.delete("estado")
    }

    router.push(`?${params.toString()}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())

    if (buscar) {
      params.set("buscar", buscar)
    } else {
      params.delete("buscar")
    }

    router.push(`?${params.toString()}`)
  }

  return (
    <form className="flex flex-col sm:flex-row gap-4" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          name="estado"
          value={estado}
          onValueChange={handleEstadoChange}
        >
          <SelectTrigger className="w-[180px] text-[#687373]">
            <SelectValue placeholder="Estado" className="text-[#687373]">
              {estado !== "todos"
                ? <Badge className={getEstadoColor(estado) + " px-2 py-0.5 text-xs font-medium rounded"}>{estado}</Badge>
                : "Estado"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {estados.map((estado) => (
              <SelectItem key={estado} value={estado}>
                <Badge className={getEstadoColor(estado) + " px-2 py-0.5 text-xs font-medium rounded"}>
                  {estado}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <MultiSelectRegionFilter options={uniqueRegions} className="text-[#687373]" />
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