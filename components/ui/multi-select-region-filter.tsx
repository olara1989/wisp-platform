"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface MultiSelectRegionFilterProps {
  options: string[]
  placeholder?: string
}

export function MultiSelectRegionFilter({
  options,
  placeholder = "Seleccionar región(es)...",
}: MultiSelectRegionFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(false)

  // Obtener las regiones seleccionadas de los search params
  const currentRegionParams = searchParams.getAll("region")
  const selectedRegions = currentRegionParams.filter(Boolean) // Filter out empty strings

  const handleSelect = (value: string) => {
    let newRegions: string[]
    if (selectedRegions.includes(value)) {
      newRegions = selectedRegions.filter((region) => region !== value)
    } else {
      newRegions = [...selectedRegions, value]
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete("region") // Clear all existing region params
    newRegions.forEach((region) => params.append("region", region))

    // Preserve other search params like 'estado' and 'buscar'
    if (searchParams.has("estado")) {
      params.set("estado", searchParams.get("estado") as string)
    }
    if (searchParams.has("buscar")) {
      params.set("buscar", searchParams.get("buscar") as string)
    }

    router.push(`?${params.toString()}`)
  }

  const displayValue = selectedRegions.length > 0
    ? selectedRegions.map(region => (
        <Badge key={region} variant="secondary" className="mr-1 mb-1">
          {region}
        </Badge>
      ))
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex flex-wrap items-center">
            {displayValue || placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar región..." />
          <CommandList>
            <CommandEmpty>No se encontró ninguna región.</CommandEmpty>
            <CommandGroup>
              {options.map((region) => (
                <CommandItem
                  key={region}
                  value={region}
                  onSelect={() => handleSelect(region)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedRegions.includes(region) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {region}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 