"use client"

import { useState, memo } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, User, LogOut, Settings } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { cn } from "@/lib/utils"

export const Header = memo(function Header() {
  const { user, signOut, userRole } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400 inline" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px] pr-0 bg-white dark:bg-gray-800 transition-colors duration-200">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">WISP Manager</h1>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <span className="cursor-pointer">
                <User className="h-5 w-5 text-gray-500 dark:text-gray-400 inline" />
                <span className="sr-only">Menú de usuario</span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors duration-200">
              <DropdownMenuLabel className="px-4 py-2 text-gray-800 dark:text-gray-200 font-medium">Mi cuenta</DropdownMenuLabel>
              <DropdownMenuLabel className="font-normal text-xs text-gray-500 dark:text-gray-400 px-4 py-1">{user?.email}</DropdownMenuLabel>
              <DropdownMenuLabel className="font-normal text-xs text-gray-500 dark:text-gray-400 px-4 py-1 capitalize">
                Rol: {userRole || "Usuario"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
              {userRole === "admin" && (
                <DropdownMenuItem asChild className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                  <a href="/configuracion">
                    <Settings className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span>Configuración</span>
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={async () => { await signOut(); window.location.href = "/login"; }} className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
})
