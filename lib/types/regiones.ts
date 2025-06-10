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
    id: "la-victoria",
    nombre: "La Victoria",
    codigo: "LV"
  },
  {
    id: "pinos",
    nombre: "Pinos",
    codigo: "PN"
  },
  {
    id: "el-obraje",
    nombre: "El Obraje",
    codigo: "EO"
  },
  {
    id: "el-chiquihuitillo",
    nombre: "El Chiquihuitillo",
    codigo: "EC"
  },
  {
    id: "san-jose",
    nombre: "San José",
    codigo: "SJ"
  },
  {
    id: "la-noria",
    nombre: "La Noria",
    codigo: "LN"
  }
] 