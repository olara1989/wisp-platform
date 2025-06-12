"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  lat: 22.256215, 
  lng: -101.629182,
}

export const GoogleMapInput: React.FC<GoogleMapInputProps> = ({
  initialLat,
  initialLng,
  onLocationChange,
}) => {
  const [mounted, setMounted] = useState(false)
  const [mapType, setMapType] = useState<google.maps.MapTypeId | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isLoaded && window.google) {
      setMapType(window.google.maps.MapTypeId.HYBRID)
    }
  }, [isLoaded])

  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral>(() => ({
    lat: initialLat || defaultCenter.lat,
    lng: initialLng || defaultCenter.lng,
  }))
  const mapRef = useRef<google.maps.Map | null>(null)

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
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
  if (!isLoaded || !mounted || !mapType) return <div>Cargando mapa...</div>

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
      <div className="flex space-x-2 mb-2">
        <Button
          onClick={() => setMapType(window.google.maps.MapTypeId.ROADMAP)}
          className={cn(
            "px-3 py-1 border rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200",
            mapType === window.google.maps.MapTypeId.ROADMAP ? "bg-gray-100 dark:bg-gray-700" : ""
          )}
        >
          Mapa
        </Button>
        <Button
          onClick={() => setMapType(window.google.maps.MapTypeId.HYBRID)}
          className={cn(
            "px-3 py-1 border rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200",
            mapType === window.google.maps.MapTypeId.HYBRID ? "bg-gray-100 dark:bg-gray-700" : ""
          )}
        >
          Satélite
        </Button>
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={16}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          mapTypeId: mapType,
        }}
      >
        <Marker
          position={markerPosition}
          draggable={true}
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
    </div>
  )
} 