"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

interface GoogleMapInputProps {
  initialLat?: number
  initialLng?: number
  onLocationChange: (lat: number, lng: number) => void
}

const containerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 9.9281, // San José, Costa Rica
  lng: -84.0907,
}

export const GoogleMapInput: React.FC<GoogleMapInputProps> = ({
  initialLat,
  initialLng,
  onLocationChange,
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral>(() => ({
    lat: initialLat || defaultCenter.lat,
    lng: initialLng || defaultCenter.lng,
  }))
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    // Asegurar que la ubicación inicial se envíe al formulario
    onLocationChange(markerPosition.lat, markerPosition.lng)
  }, [onLocationChange, markerPosition])

  const onUnmount = useCallback(() => {
    mapRef.current = null
  }, [])

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat()
      const newLng = e.latLng.lng()
      setMarkerPosition({ lat: newLat, lng: newLng })
      onLocationChange(newLat, newLng)
    }
  }, [onLocationChange])

  if (loadError) return <div>Error al cargar el mapa.</div>
  if (!isLoaded || !mounted) return <div>Cargando mapa...</div>

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPosition} // El centro del mapa se ajusta a la posición del marcador
      zoom={13}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={onMapClick}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      <Marker
        position={markerPosition}
        draggable={true} // Permite arrastrar el marcador
        onDragEnd={(e) => {
          if (e.latLng) {
            const newLat = e.latLng.lat()
            const newLng = e.latLng.lng()
            setMarkerPosition({ lat: newLat, lng: newLng })
            onLocationChange(newLat, newLng)
          }
        }}
      />
    </GoogleMap>
  )
} 