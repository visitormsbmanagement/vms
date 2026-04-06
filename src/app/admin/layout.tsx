"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/visitors", label: "Visitors", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {navLinks.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(link.href + "/")
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Skip auth check on the login page
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false)
      setAuthenticated(true)
      return
    }

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/admin/me")
        if (!res.ok) throw new Error("Not authenticated")
        setAuthenticated(true)
      } catch {
        router.replace("/admin/login")
      } finally {
        setChecking(false)
      }
    }

    checkAuth()
  }, [isLoginPage, router])

  async function handleLogout() {
    try {
      await fetch("/api/auth/admin/logout", { method: "POST" })
    } catch {
      // ignore
    }
    toast.success("Logged out")
    router.push("/admin/login")
  }

  // Login page renders without the sidebar layout
  if (isLoginPage) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <div className="flex h-14 items-center gap-2 px-4">
          <Image src="/MSBDOCS-Logo-new.svg" alt="MSB Docs" width={120} height={28} />
        </div>
        <Separator />
        <div className="flex flex-1 flex-col gap-2 p-3">
          <SidebarNav />
        </div>
        <Separator />
        <div className="p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile header + sheet sidebar */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle className="flex items-center gap-2">
                  <Image src="/MSBDOCS-Logo-new.svg" alt="MSB Docs" width={120} height={28} />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <SidebarNav onLinkClick={() => setMobileOpen(false)} />
              </div>
              <Separator />
              <div className="p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Image src="/MSBDOCS-Logo-new.svg" alt="MSB Docs" width={110} height={26} />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
