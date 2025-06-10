import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases de Tailwind de manera eficiente
 * Utiliza clsx para combinar clases y twMerge para resolver conflictos
 *
 * @param inputs Clases a combinar
 * @returns String con las clases combinadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como moneda (MXN)
 *
 * @param amount Cantidad a formatear
 * @returns String formateado como moneda
 */
export function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(num)
}

/**
 * Formatea una fecha en formato dd/mm/yyyy
 *
 * @param date Fecha a formatear
 * @returns String con la fecha formateada
 */
export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

/**
 * Obtiene la clase de color según el estado del cliente
 *
 * @param estado Estado del cliente (activo, moroso, suspendido, baja)
 * @returns Clases de Tailwind para el color del estado
 */
export function getEstadoColor(estado: string) {
  switch (estado.toLowerCase()) {
    case "activo":
      return "bg-green-100 text-green-800"
    case "moroso":
      return "bg-yellow-100 text-yellow-800"
    case "suspendido":
      return "bg-red-100 text-red-800"
    case "baja":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-blue-100 text-blue-800"
  }
}

/**
 * Obtiene la clase de color según el estado de pago
 *
 * @param estado Estado del pago (pagado, pendiente, vencido)
 * @returns Clases de Tailwind para el color del estado
 */
export function getEstadoPagoColor(estado: string) {
  switch (estado.toLowerCase()) {
    case "pagado":
      return "bg-green-100 text-green-800"
    case "pendiente":
      return "bg-yellow-100 text-yellow-800"
    case "vencido":
      return "bg-red-100 text-red-800"
    default:
      return "bg-blue-100 text-blue-800"
  }
}
