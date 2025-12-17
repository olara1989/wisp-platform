import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore"

export async function POST(request: Request) {
  try {
    // Note: Unable to verify Auth Token without Admin SDK. Proceeding without server-side auth check.
    // Ensure Firestore Rules protect data access if possible, or implement a secret key check.

    const { routerId, clienteIp, metodo } = await request.json()

    // Obtener información del router
    const routerDoc = await getDoc(doc(db, "routers", routerId))

    if (!routerDoc.exists()) {
      return NextResponse.json({ error: "Router no encontrado" }, { status: 404 })
    }
    const router = routerDoc.data();

    // En producción, aquí se conectaría realmente a Mikrotik
    // Por ahora, simulamos una respuesta exitosa

    // Actualizar estado del cliente
    // Buscar dispositivo por IP to get client_id
    const q = query(collection(db, "dispositivos"), where("ip", "==", clienteIp))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      const dispositivo = snapshot.docs[0].data()
      const clienteId = dispositivo.cliente_id
      if (clienteId) {
        await updateDoc(doc(db, "clientes", clienteId), { estado: "activo" })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en reactivarCliente:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
        details: error instanceof Error ? error.stack : "No hay detalles disponibles",
      },
      { status: 500 },
    )
  }
}
