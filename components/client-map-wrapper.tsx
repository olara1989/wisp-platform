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
      <div className="text-center py-6">
        <p className="text-muted-foreground">No hay ubicación registrada para este cliente</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <DynamicGoogleMapInput
        initialLat={initialLat}
        initialLng={initialLng}
        onLocationChange={() => {}} // La ubicación es fija para la vista de detalle
      />
      <p className="text-sm text-muted-foreground">
        Lat: {initialLat.toFixed(6)}, Lng: {initialLng.toFixed(6)}
      </p>
    </div>
  )
} 