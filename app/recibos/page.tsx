"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Loader2, FileText, CheckCircle2, Circle, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface Cliente {
    id: string
    nombre: string
    ip: string
    plan: string
    region: string
}

const MESES_ANUALIDAD = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

function RecibosContent() {
    const searchParams = useSearchParams()
    const monthParam = searchParams.get("month") || ""
    const year = searchParams.get("year") || ""
    const regions = searchParams.getAll("region")

    const [clientes, setClientes] = useState<Cliente[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [planesMap, setPlanesMap] = useState<Map<string, number>>(new Map())
    const [loading, setLoading] = useState(true)
    const [isAllSelected, setIsAllSelected] = useState(true)
    const [extraCount, setExtraCount] = useState(0)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const planesSnap = await getDocs(collection(db, "planes"))
                const pMap = new Map<string, number>()
                planesSnap.forEach(doc => {
                    pMap.set(doc.id, doc.data().precio || 0)
                })
                setPlanesMap(pMap)

                let q = query(collection(db, "clientes"), where("estado", "==", "activo"))

                if (regions.length > 0 && !regions.includes("todas")) {
                    q = query(q, where("region", "in", regions))
                }

                const querySnapshot = await getDocs(q)
                const clientsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Cliente[]

                clientsData.sort((a, b) => {
                    const ipA = parseInt(a.ip?.split('.').pop() || "0")
                    const ipB = parseInt(b.ip?.split('.').pop() || "0")
                    return ipA - ipB
                })

                setClientes(clientsData)
                setSelectedIds(new Set(clientsData.map(c => c.id)))
            } catch (error) {
                console.error("Error fetching data for receipts:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [JSON.stringify(regions)])

    const toggleClient = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
        setIsAllSelected(newSelected.size === clientes.length)
    }

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set())
            setIsAllSelected(false)
        } else {
            setSelectedIds(new Set(clientes.map(c => c.id)))
            setIsAllSelected(true)
        }
    }

    const receiptsToRender = useMemo(() => {
        const selectedClients = clientes.filter(c => selectedIds.has(c.id))
        const items: { cliente: Cliente | null; month: string }[] = []

        const months = monthParam === "Todos" ? MESES_ANUALIDAD : [monthParam]

        months.forEach(m => {
            // Add real receipts
            selectedClients.forEach(cliente => {
                items.push({ cliente, month: m })
            })
            // Add extra blank receipts for this month
            for (let i = 0; i < extraCount; i++) {
                items.push({ cliente: null, month: m })
            }
        })
        return items
    }, [clientes, selectedIds, monthParam, extraCount])

    // Change to 8 items per page
    const itemsPerPage = 8
    const pages = []
    for (let i = 0; i < receiptsToRender.length; i += itemsPerPage) {
        pages.push(receiptsToRender.slice(i, i + itemsPerPage))
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Cargando clientes para selección...</p>
            </div>
        )
    }

    return (
        <div className="receipts-container bg-white text-black p-0 m-0">
            <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0.3cm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
        .receipt-row-container {
          display: flex;
          width: 100%;
          border: 1px solid black;
          margin-bottom: 2px;
          min-height: 2.8cm;
          page-break-inside: avoid;
        }
        .stub-part {
          width: 33%;
          border-right: 2px solid black;
          padding: 4px;
          display: flex;
          flex-direction: column;
        }
        .main-part {
          width: 67%;
          padding: 4px;
          display: flex;
          flex-direction: column;
        }
        .receipt-header {
          background-color: #e5e7eb;
          text-align: center;
          font-weight: bold;
          border-bottom: 1px solid black;
          padding: 1px;
          font-size: 10px;
          text-transform: uppercase;
        }
        .field-row {
          display: flex;
          align-items: baseline;
          border-bottom: 1px solid black;
          padding: 2px 0;
          font-size: 10px;
        }
        .field-row-last {
          border-bottom: none;
        }
        .field-label {
          font-weight: bold;
          margin-right: 4px;
          white-space: nowrap;
        }
        .field-value {
          flex-grow: 1;
          min-height: 12px;
        }
        .underline-space {
          flex-grow: 1;
          border-bottom: 1px dotted #666;
          margin-left: 2px;
        }
      `}</style>

            {/* Selection and Control Panel */}
            <div className="no-print bg-gray-50 border-b p-4 sticky top-0 z-20 shadow-md">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Users size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">
                                Generación de Recibos
                            </h1>
                            <p className="text-xs text-gray-500">
                                Seleccionados: <span className="font-bold text-primary">{selectedIds.size}</span> |
                                Meses: <span className="font-bold text-primary">{monthParam === "Todos" ? '12' : '1'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white border border-primary/20 px-3 py-1.5 rounded shadow-sm">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-tighter">Extras por mes:</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={extraCount}
                                onChange={(e) => setExtraCount(parseInt(e.target.value) || 0)}
                                className="w-16 border-2 border-primary/10 rounded px-1.5 py-0.5 text-sm font-black text-primary outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>

                        <button
                            onClick={toggleAll}
                            className="bg-white border-2 border-gray-100 px-4 py-2 rounded text-xs hover:bg-gray-100 transition-all flex items-center gap-2 font-bold shadow-sm"
                        >
                            {isAllSelected ? <Circle size={14} /> : <CheckCircle2 size={14} className="text-green-600" />}
                            {isAllSelected ? 'LIMPIAR SELECCIÓN' : 'SELECT. TODOS'}
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="bg-primary text-white px-8 py-2.5 rounded font-black hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg text-sm"
                            disabled={selectedIds.size === 0 && extraCount === 0}
                        >
                            <FileText size={18} /> GENERAR {receiptsToRender.length} RECIBOS
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mt-4 max-h-[180px] overflow-y-auto bg-white border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 custom-scrollbar">
                    {clientes.map(cliente => (
                        <div
                            key={cliente.id}
                            onClick={() => toggleClient(cliente.id)}
                            className={`flex items-center space-x-2 p-2 rounded-md border cursor-pointer select-none transition-all ${selectedIds.has(cliente.id)
                                ? 'bg-primary/5 border-primary/20 shadow-sm'
                                : 'border-gray-100 hover:border-gray-300'
                                }`}
                        >
                            <Checkbox
                                id={`check-${cliente.id}`}
                                checked={selectedIds.has(cliente.id)}
                                onCheckedChange={() => toggleClient(cliente.id)}
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-mono font-bold text-gray-400">IP: .{cliente.ip?.split('.').pop()}</span>
                                <span className="text-xs font-medium truncate text-gray-700">{cliente.nombre}</span>
                            </div>
                        </div>
                    ))}
                    {clientes.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-400 text-sm italic">
                            No se encontraron clientes activos para esta región.
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>

            <div className="pt-8 no-print text-center text-gray-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                --- Vista Previa de Recibos para PDF ---
            </div>

            {pages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center p-24 text-gray-300 no-print border-2 border-dashed border-gray-100 rounded-3xl max-w-2xl mx-auto">
                    <Users size={64} className="mb-4 opacity-10" />
                    <p className="font-bold text-lg">Sin contenido para generar</p>
                    <p className="text-sm">Selecciona al menos un cliente o agrega recibos extra.</p>
                </div>
            )}

            {pages.map((pageItems, pageIdx) => (
                <div key={pageIdx} className={`print-page ${pageIdx < pages.length - 1 ? 'page-break' : ''} max-w-[21cm] mx-auto bg-white pt-2`}>
                    <div className="flex flex-col gap-[1px]">
                        {pageItems.map((item, idx) => (
                            <div key={`${item.cliente?.id || 'extra'}-${item.month}-${idx}`} className="receipt-row-container">
                                {/* TALÓN (33%) */}
                                <div className="stub-part">
                                    <div className="receipt-header">{item.cliente ? 'TALÓN DE CONTROL' : 'RECIBO EXTRA (COPIA)'}</div>
                                    <div className="field-row">
                                        <span className="field-label">FECHA:</span>
                                        <div className="underline-space"></div>
                                        <span className="field-label ml-2">IP:</span>
                                        <span className="font-bold">{item.cliente ? item.cliente.ip?.split('.').pop() : ''}</span>
                                    </div>
                                    <div className="field-row">
                                        <span className="field-label">CLIENTE:</span>
                                        <span className="field-value truncate">{item.cliente?.nombre || ''}</span>
                                    </div>
                                    <div className="field-row">
                                        <span className="field-label">CANTIDAD:</span>
                                        <span className="font-bold uppercase">{item.cliente ? `$${planesMap.get(item.cliente.plan) || "0"}` : ''}</span>
                                    </div>
                                    <div className="field-row field-row-last">
                                        <span className="field-label">MES:</span>
                                        <span className="field-value">{item.month} {year}</span>
                                    </div>
                                </div>

                                {/* RECIBO PRINCIPAL (67%) */}
                                <div className="main-part">
                                    <div className="receipt-header">RECIBO DE MENSUALIDAD INTERNET</div>
                                    <div className="field-row">
                                        <span className="field-label">FECHA:</span>
                                        <div className="underline-space"></div>
                                        <span className="field-label ml-4">IP:</span>
                                        <span className="font-bold">{item.cliente?.ip || ''}</span>
                                    </div>
                                    <div className="field-row">
                                        <span className="field-label">A NOMBRE DE:</span>
                                        <span className="field-value font-medium text-center uppercase whitespace-pre">{item.cliente?.nombre || ' '}</span>
                                    </div>
                                    <div className="field-row">
                                        <span className="field-label">LA CANTIDAD DE:</span>
                                        <span className="text-sm font-bold ml-2 underline">{item.cliente ? `$${planesMap.get(item.cliente.plan) || "___"}` : ''}</span>
                                    </div>
                                    <div className="field-row field-row-last">
                                        <span className="field-label">POR EL MES DE:</span>
                                        <span className="ml-1 font-medium">{item.month} {year}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function RecibosPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <RecibosContent />
        </Suspense>
    )
}
