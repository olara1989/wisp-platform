"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-provider"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { initializeApp, getApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"

// We need the config to initialize secondary app
const firebaseConfig = {
  apiKey: "AIzaSyDL2_5IpJ7Rx0qS7RoQLV2987fw47jgNpw",
  authDomain: "alphanet-8b60f.firebaseapp.com",
  projectId: "alphanet-8b60f",
  storageBucket: "alphanet-8b60f.firebasestorage.app",
  messagingSenderId: "467138234934",
  appId: "1:467138234934:web:b98d946f96a4f1aae2e697",
  measurementId: "G-DN04YB0CXH"
};

export default function NuevoUsuarioPage() {
  const { userRole } = useAuth();
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  if (userRole !== "admin") {
    // Optional: loading state or null
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const nombre = formData.get("nombre") as string
    const email = formData.get("email") as string
    const rol = formData.get("rol") as string
    const password = formData.get("password") as string

    try {
      // 1. Create Auth User using secondary app (to avoid logging out admin)
      const secondaryApp = initializeApp(firebaseConfig, "Secondary")
      const secondaryAuth = getAuth(secondaryApp)
      await createUserWithEmailAndPassword(secondaryAuth, email, password)

      // Cleanup secondary app
      await signOut(secondaryAuth)
      // Note: delete() is not exposed in modular SDK easily or just let it be. 
      // The instance is named "Secondary".

      // 2. Create Firestore Record
      await addDoc(collection(db, "usuarios"), {
        nombre,
        email,
        rol,
        // password_hash: password, // Unsafe to store. Firebase Auth handles it.
        created_at: serverTimestamp()
      })

      toast({ title: "Usuario creado exitosamente" })
      router.push("/usuarios")
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Error al crear usuario",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <Card className="max-w-lg mx-auto mt-8">
        <CardHeader>
          <CardTitle>Nuevo Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="rol">Rol</Label>
              <select id="rol" name="rol" className="border rounded px-2 py-2 w-full" required>
                <option value="admin">Administrador</option>
                <option value="tecnico">Técnico</option>
                <option value="cajero">Cajero</option>
              </select>
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando..." : "Crear Usuario"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
