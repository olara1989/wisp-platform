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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, Loader2 } from "lucide-react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import * as XLSX from "xlsx"
import { formatDate } from "@/lib/utils"

interface ExportClientesExcelDialogProps {
    filters: {
        estado: string
        buscar: string | null
        regiones: string[]
    }
}

const FIELDS = [
    { id: "nombre", label: "Nombre" },
    { id: "ip", label: "IP" },
    { id: "telefono", label: "Teléfono" },
    { id: "email", label: "Email" },
    { id: "direccion", label: "Dirección" },
    { id: "region", label: "Región" },
    { id: "plan", label: "Plan" },
    { id: "estado", label: "Estado" },
    { id: "fecha_alta", label: "Fecha Alta" },
    { id: "notas", label: "Notas" },
]

export function ExportClientesExcelDialog({ filters }: ExportClientesExcelDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedFields, setSelectedFields] = useState<string[]>(FIELDS.map(f => f.id))

    const toggleField = (id: string) => {
        if (selectedFields.includes(id)) {
            setSelectedFields(selectedFields.filter(f => f !== id))
        } else {
            setSelectedFields([...selectedFields, id])
        }
    }

    const handleExport = async () => {
        setLoading(true)
        try {
            // 1. Fetch Planes for manual join (similar to ClientesPage)
            const planesSnapshot = await getDocs(collection(db, "planes"))
            const planesMap = new Map<string, string>()
            planesSnapshot.forEach(doc => {
                const data = doc.data()
                planesMap.set(doc.id, data.nombre)
            })

            // 2. Fetch Clientes with filters
            const clientesRef = collection(db, "clientes")
            const constraints = []

            if (filters.estado && filters.estado !== "todos") {
                constraints.push(where("estado", "==", filters.estado.toLowerCase()))
            }

            if (filters.regiones && filters.regiones.length > 0) {
                constraints.push(where("region", "in", filters.regiones))
            }

            const q = constraints.length > 0
                ? query(clientesRef, ...constraints)
                : query(clientesRef)

            const snapshot = await getDocs(q)
            let results = snapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    ...data,
                    id: doc.id,
                    plan_nombre: data.plan ? (planesMap.get(data.plan) || "Desconocido") : "Sin Plan"
                }
            })

            // 3. Apply 'buscar' filter client-side if present
            if (filters.buscar) {
                const searchLower = filters.buscar.toLowerCase()
                results = results.filter((c: any) =>
                    c.nombre?.toLowerCase().includes(searchLower) ||
                    c.email?.toLowerCase().includes(searchLower) ||
                    c.telefono?.includes(searchLower) ||
                    c.ip?.includes(searchLower)
                )
            }

            // 4. Sort by IP numerically (same as ClientesPage)
            results.sort((a: any, b: any) => {
                const ipA = parseInt(a.ip?.split('.').pop() || "0")
                const ipB = parseInt(b.ip?.split('.').pop() || "0")
                return ipA - ipB
            })

            // 5. Transform data for Excel based on selected fields
            const exportData = results.map((c: any) => {
                const row: any = {}
                if (selectedFields.includes("nombre")) row["Nombre"] = c.nombre || ""
                if (selectedFields.includes("ip")) row["IP"] = c.ip || ""
                if (selectedFields.includes("telefono")) row["Teléfono"] = c.telefono || ""
                if (selectedFields.includes("email")) row["Email"] = c.email || ""
                if (selectedFields.includes("direccion")) row["Dirección"] = c.direccion || ""
                if (selectedFields.includes("region")) row["Región"] = c.region || ""
                if (selectedFields.includes("plan")) row["Plan"] = c.plan_nombre || ""
                if (selectedFields.includes("estado")) row["Estado"] = c.estado || ""
                if (selectedFields.includes("fecha_alta")) row["Fecha Alta"] = c.fecha_alta ? formatDate(c.fecha_alta) : ""
                if (selectedFields.includes("notas")) row["Notas"] = c.notas || ""
                return row
            })

            // 6. Generate Excel
            const worksheet = XLSX.utils.json_to_sheet(exportData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes")

            // Adjust column widths automatically
            const wscols = FIELDS.filter(f => selectedFields.includes(f.id)).map(() => ({ wch: 20 }))
            worksheet["!cols"] = wscols

            // 7. Trigger download
            XLSX.writeFile(workbook, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`)

            setOpen(false)
        } catch (error) {
            console.error("Error exporting to Excel:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Download size={16} /> Exportar Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Exportar Clientes a Excel</DialogTitle>
                    <DialogDescription>
                        Selecciona los campos que deseas incluir en el archivo Excel.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    {FIELDS.map((field) => (
                        <div key={field.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`field-${field.id}`}
                                checked={selectedFields.includes(field.id)}
                                onCheckedChange={() => toggleField(field.id)}
                            />
                            <Label
                                htmlFor={`field-${field.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                            >
                                {field.label}
                            </Label>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button
                        variant="secondary"
                        onClick={() => setSelectedFields([])}
                        disabled={loading}
                    >
                        Limpiar
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedFields(FIELDS.map(f => f.id))}
                        disabled={loading}
                    >
                        Todos
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={loading || selectedFields.length === 0}
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                        ) : (
                            "Descargar Excel"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
