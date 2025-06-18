import { redirect } from "next/navigation"

export default function Home() {
  // Redirigir a la página de setup para configuración inicial
  redirect("/setup")
}