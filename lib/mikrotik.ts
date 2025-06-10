/**
 * Integración con Mikrotik RouterOS
 * 
 * Este archivo contiene las funciones para interactuar con la API de Mikrotik RouterOS
 * a través de endpoints personalizados. Las funciones manejan:
 * - Suspensión de clientes
 * - Reactivación de clientes
 * - Pruebas de conexión con routers
 * 
 * Todas las funciones son asíncronas y manejan errores apropiadamente.
 */

/**
 * Suspende el acceso a internet de un cliente específico
 * 
 * @param routerId - ID del router Mikrotik
 * @param clienteIp - Dirección IP del cliente a suspender
 * @param metodo - Método de suspensión (ej: "address-list", "firewall")
 * @returns Respuesta del servidor con el resultado de la operación
 * @throws Error si la operación falla
 */
export async function suspenderCliente(routerId: string, clienteIp: string, metodo: string) {
  try {
    const response = await fetch("/api/mikrotik/suspender", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        routerId,
        clienteIp,
        metodo,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al suspender cliente")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en suspenderCliente:", error)
    throw error
  }
}

/**
 * Reactiva el acceso a internet de un cliente previamente suspendido
 * 
 * @param routerId - ID del router Mikrotik
 * @param clienteIp - Dirección IP del cliente a reactivar
 * @param metodo - Método de reactivación (debe coincidir con el método de suspensión)
 * @returns Respuesta del servidor con el resultado de la operación
 * @throws Error si la operación falla
 */
export async function reactivarCliente(routerId: string, clienteIp: string, metodo: string) {
  try {
    const response = await fetch("/api/mikrotik/reactivar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        routerId,
        clienteIp,
        metodo,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al reactivar cliente")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en reactivarCliente:", error)
    throw error
  }
}

/**
 * Prueba la conexión con un router Mikrotik
 * 
 * @param ip - Dirección IP del router
 * @param usuario - Nombre de usuario para la conexión
 * @param password - Contraseña para la conexión
 * @param puerto - Puerto de la API (por defecto 8728)
 * @returns Respuesta del servidor con el resultado de la prueba
 * @throws Error si la conexión falla
 */
export async function testRouterConnection(ip: string, usuario: string, password: string, puerto: number) {
  try {
    const response = await fetch("/api/mikrotik/test-connection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ip,
        usuario,
        password,
        puerto,
      }),
    })

    if (!response.ok) {
      throw new Error("Error al probar conexión")
    }

    return await response.json()
  } catch (error) {
    console.error("Error en testRouterConnection:", error)
    throw error
  }
}
