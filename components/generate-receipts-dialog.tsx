"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { FileText, CheckSquare, Square } from "lucide-react"
import { REGIONES } from "@/lib/types/regiones"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

const MESES = [
    { value: "Todos", label: "Toda la anualidad (12 meses)" },
    { value: "Enero", label: "Enero" },
    { value: "Febrero", label: "Febrero" },
    { value: "Marzo", label: "Marzo" },
    { value: "Abril", label: "Abril" },
    { value: "Mayo", label: "Mayo" },
    { value: "Junio", label: "Junio" },
    { value: "Julio", label: "Julio" },
    { value: "Agosto", label: "Agosto" },
    { value: "Septiembre", label: "Septiembre" },
    { value: "Octubre", label: "Octubre" },
    { value: "Noviembre", label: "Noviembre" },
    { value: "Diciembre", label: "Diciembre" },
]

export function GenerateReceiptsDialog() {
    const [open, setOpen] = useState(false)
    const [month, setMonth] = useState<string>(MESES[new Date().getMonth() + 1].value)
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())
    const [selectedRegions, setSelectedRegions] = useState<string[]>(REGIONES.map(r => r.id))

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString())

    const toggleRegion = (id: string) => {
        if (selectedRegions.includes(id)) {
            setSelectedRegions(selectedRegions.filter(r => r !== id))
        } else {
            setSelectedRegions([...selectedRegions, id])
        }
    }

    const toggleAllRegions = () => {
        if (selectedRegions.length === REGIONES.length) {
            setSelectedRegions([])
        } else {
            setSelectedRegions(REGIONES.map(r => r.id))
        }
    }

    const handleGenerate = () => {
        if (selectedRegions.length === 0) return

        const params = new URLSearchParams()
        params.set("month", month)
        params.set("year", year)

        // Append all selected regions
        selectedRegions.forEach(r => params.append("region", r))

        const url = `/recibos?${params.toString()}`
        window.open(url, "_blank")
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" /> Generar Recibos
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Generar Recibos Mensuales</DialogTitle>
                    <DialogDescription>
                        Selecciona el mes, año y las regiones para generar los recibos.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="month" className="text-right font-bold">
                            Mes
                        </Label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger id="month" className="col-span-3">
                                <SelectValue placeholder="Selecciona mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {MESES.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="year" className="text-right font-bold">
                            Año
                        </Label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger id="year" className="col-span-3">
                                <SelectValue placeholder="Selecciona año" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right font-bold pt-2">
                            Regiones
                        </Label>
                        <div className="col-span-3 space-y-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={toggleAllRegions}
                            >
                                {selectedRegions.length === REGIONES.length ? (
                                    <><Square className="mr-2 h-3 w-3" /> Desmarcar Todas</>
                                ) : (
                                    <><CheckSquare className="mr-2 h-3 w-3" /> Seleccionar Todas</>
                                )}
                            </Button>
                            <ScrollArea className="h-[150px] border rounded-md p-3 bg-gray-50/50">
                                <div className="grid grid-cols-1 gap-2">
                                    {REGIONES.map((r) => (
                                        <div key={r.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`region-${r.id}`}
                                                checked={selectedRegions.includes(r.id)}
                                                onCheckedChange={() => toggleRegion(r.id)}
                                            />
                                            <label
                                                htmlFor={`region-${r.id}`}
                                                className="text-sm font-medium leading-none cursor-pointer"
                                            >
                                                {r.nombre}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            {selectedRegions.length === 0 && (
                                <p className="text-[10px] text-destructive font-bold">Debes seleccionar al menos una región.</p>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={handleGenerate}
                        disabled={selectedRegions.length === 0}
                    >
                        Generar ({selectedRegions.length} regiones)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
