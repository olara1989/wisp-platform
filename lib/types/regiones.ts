/**
 * Tipos y constantes para el manejo de regiones en WISP Manager
 */

export type Region = {
  id: string
  nombre: string
  codigo: string
}

/**
 * Lista de regiones disponibles en el sistema
 */
export const REGIONES: Region[] = [
  {
    id: "La Victoria",
    nombre: "La Victoria",
    codigo: "LV"
  },
  {
    id: "Pinos",
    nombre: "Pinos",
    codigo: "PN"
  },
  {
    id: "El Obraje",
    nombre: "El Obraje",
    codigo: "EO"
  },
  {
    id: "El Chiquihuitillo",
    nombre: "El Chiquihuitillo",
    codigo: "EC"
  },
  {
    id: "San José",
    nombre: "San José",
    codigo: "SJ"
  },
  {
    id: "La Noria",
    nombre: "La Noria",
    codigo: "LN"
  },
  {
    id: "El Nigroman",
    nombre: "El Nigroman",
    codigo: "EN"
  }
] 