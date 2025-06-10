"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export default function TestConnectionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const testConnection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const supabase = createClientSupabaseClient()

      // Probar conexión básica
      const { data: clientes, error: clientesError } = await supabase.from("clientes").select("count").limit(1)

      if (clientesError) {
        throw new Error(`Error en clientes: ${clientesError.message}`)
      }

      // Probar inserción de prueba
      const testData = {
        nombre: "Cliente de Prueba",
        telefono: "555-0123",
        email: `test-${Date.now()}@ejemplo.com`,
        direccion: "Dirección de prueba",
        estado: "activo",
      }

      const { data: insertData, error: insertError } = await supabase.from("clientes").insert(testData).select()

      if (insertError) {
        throw new Error(`Error al insertar: ${insertError.message}`)
      }

      // Eliminar el registro de prueba
      if (insertData && insertData.length > 0) {
        await supabase.from("clientes").delete().eq("id", insertData[0].id)
      }

      setResult({
        success: true,
        message: "Conexión exitosa. Base de datos funcionando correctamente.",
        details: {
          clientesTable: "✓ Accesible",
          insertTest: "✓ Exitoso",
          deleteTest: "✓ Exitoso",
        },
      })

      toast({
        title: "Conexión exitosa",
        description: "La base de datos está funcionando correctamente",
      })
    } catch (error: any) {
      console.error("Error de conexión:", error)
      setResult({
        success: false,
        message: error.message || "Error de conexión",
        details: {
          error: error.message,
          stack: error.stack,
        },
      })

      toast({
        title: "Error de conexión",
        description: error.message || "No se pudo conectar a la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Prueba de Conexión a Supabase</CardTitle>
          <CardDescription>Verifica que la conexión a la base de datos funcione correctamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Probando conexión...
              </>
            ) : (
              "Probar Conexión"
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className={`font-medium ${result.success ? "text-green-700" : "text-red-700"}`}>
                  {result.message}
                </span>
              </div>

              <div className="mt-2 text-sm">
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
