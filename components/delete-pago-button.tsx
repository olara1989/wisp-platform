"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { db } from "@/lib/firebase"
import { doc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"

interface DeletePagoButtonProps {
    pagoId: string
}

export function DeletePagoButton({ pagoId }: DeletePagoButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            await deleteDoc(doc(db, "pagos", pagoId))

            toast({
                title: "Pago eliminado",
                description: "El pago ha sido eliminado correctamente.",
            })

            router.refresh()
            // Forzamos una recarga para actualizar la lista si el router.refresh() no es suficiente en algunos casos de estado local
            window.location.reload()
        } catch (error) {
            console.error("Error al eliminar el pago:", error)
            toast({
                title: "Error",
                description: "No se pudo eliminar el pago. Inténtalo de nuevo.",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de este pago.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
