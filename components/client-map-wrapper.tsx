"use client"

import dynamic from "next/dynamic"
import React from "react"

const DynamicGoogleMapInput = dynamic(() => import("@/components/ui/google-map-input").then((mod) => mod.GoogleMapInput), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
})

interface ClientMapWrapperProps {
  initialLat: number | null
  initialLng: number | null
}

export const ClientMapWrapper: React.FC<ClientMapWrapperProps> = ({
  initialLat,
  initialLng,
}) => {
  if (initialLat === null || initialLng === null) {
    return (
      <div className="text-center py-6 text-muted-foreground dark:text-gray-400">
        <p>No hay ubicación registrada para este cliente</p>
      </div>
    )
  }

  return (
    <>
      <DynamicGoogleMapInput
        initialLat={initialLat}
        initialLng={initialLng}
        onLocationChange={() => {}} // La ubicación es fija para la vista de detalle
      />
      <p className="text-sm text-muted-foreground mt-2 dark:text-gray-400">
        Lat: {initialLat.toFixed(6)}, Lng: {initialLng.toFixed(6)}
      </p>
    </>
  )
} 