"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getEstadoColor } from "@/lib/utils"

interface ClientesAdvancedFilterProps {
    uniqueRegions: string[]
}

const estados = [
    "activo",
    "cortado",
    "recoger equipo",
    "pausado",
    "suspendido"
] as const

export function ClientesAdvancedFilter({ uniqueRegions }: ClientesAdvancedFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [open, setOpen] = useState(false)

    // Local state for filters
    const [estado, setEstado] = useState("todos")
    const [selectedRegions, setSelectedRegions] = useState<string[]>([])
    const [conTelefono, setConTelefono] = useState("todos")
    const [conUbicacion, setConUbicacion] = useState("todos")

    // Sync state with URL params when sheet opens
    useEffect(() => {
        if (open) {
            setEstado(searchParams.get("estado") || "todos")

            const regions = searchParams.getAll("region")
            setSelectedRegions(regions)

            setConTelefono(searchParams.get("con_telefono") || "todos")
            setConUbicacion(searchParams.get("con_ubicacion") || "todos")
        }
    }, [open, searchParams])

    const handleRegionToggle = (region: string) => {
        setSelectedRegions(prev =>
            prev.includes(region)
                ? prev.filter(r => r !== region)
                : [...prev, region]
        )
    }

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString())

        // Estado
        if (estado && estado !== "todos") {
            params.set("estado", estado)
        } else {
            params.delete("estado")
        }

        // Regions
        params.delete("region")
        selectedRegions.forEach(r => params.append("region", r))

        // Telefono
        if (conTelefono && conTelefono !== "todos") {
            params.set("con_telefono", conTelefono)
        } else {
            params.delete("con_telefono")
        }

        // Ubicacion
        if (conUbicacion && conUbicacion !== "todos") {
            params.set("con_ubicacion", conUbicacion)
        } else {
            params.delete("con_ubicacion")
        }

        // Reset pagination to page 1 when filtering
        params.delete("page")

        router.push(`?${params.toString()}`)
        setOpen(false)
    }

    const handleReset = () => {
        setEstado("todos")
        setSelectedRegions([])
        setConTelefono("todos")
        setConUbicacion("todos")
    }

    const activeFiltersCount = [
        estado !== "todos" && estado !== "activo", // activo is default often, but let's count it if explicitly set? Logic varies. Assuming 'todos' is empty state.
        selectedRegions.length > 0,
        conTelefono !== "todos",
        conUbicacion !== "todos"
    ].filter(Boolean).length

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros Avanzados
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1 py-0 h-5 min-w-5 flex justify-center items-center">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Filtros Avanzados</SheetTitle>
                    <SheetDescription>
                        Configura criterios detallados para filtrar la lista de clientes.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-200px)] pr-4 mt-6">
                    <div className="space-y-6">

                        {/* Estado */}
                        <div className="space-y-3">
                            <Label className="text-base">Estado</Label>
                            <Select value={estado} onValueChange={setEstado}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    {estados.map((e) => (
                                        <SelectItem key={e} value={e}>
                                            <span className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${e === 'activo' ? 'bg-green-500' : e === 'suspendido' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                                {e.charAt(0).toUpperCase() + e.slice(1)}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Teléfono */}
                        <div className="space-y-3">
                            <Label className="text-base">Teléfono</Label>
                            <RadioGroup value={conTelefono} onValueChange={setConTelefono} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="todos" id="tel-todos" />
                                    <Label htmlFor="tel-todos">Todos</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="si" id="tel-si" />
                                    <Label htmlFor="tel-si">Con teléfono</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="no" id="tel-no" />
                                    <Label htmlFor="tel-no">Sin teléfono</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <Separator />

                        {/* Ubicación */}
                        <div className="space-y-3">
                            <Label className="text-base">Ubicación GPS</Label>
                            <RadioGroup value={conUbicacion} onValueChange={setConUbicacion} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="todos" id="loc-todos" />
                                    <Label htmlFor="loc-todos">Todos</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="si" id="loc-si" />
                                    <Label htmlFor="loc-si">Con ubicación</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="no" id="loc-no" />
                                    <Label htmlFor="loc-no">Sin ubicación</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <Separator />

                        {/* Regiones */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-base">Regiones</Label>
                                {selectedRegions.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedRegions([])}
                                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                    >
                                        Limpiar
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {uniqueRegions.map((region) => (
                                    <div key={region} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`region-${region}`}
                                            checked={selectedRegions.includes(region)}
                                            onCheckedChange={() => handleRegionToggle(region)}
                                        />
                                        <Label htmlFor={`region-${region}`} className="cursor-pointer text-sm font-normal">
                                            {region}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </ScrollArea>

                <SheetFooter className="mt-6 flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
                        Limpiar Filtros
                    </Button>
                    <Button onClick={handleApply} className="w-full sm:w-auto">
                        Aplicar Resultados
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
