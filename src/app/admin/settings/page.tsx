"use client"

import { useState } from "react"
import { Download, RefreshCw, QrCode } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export default function AdminSettingsPage() {
  const [qrUrl, setQrUrl] = useState(`/api/qr?t=${Date.now()}`)
  const [loading, setLoading] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  function regenerateQr() {
    setLoading(true)
    setQrUrl(`/api/qr?t=${Date.now()}`)
    setTimeout(() => setLoading(false), 500)
  }

  async function downloadQr() {
    try {
      const res = await fetch(qrUrl)
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "msb-docs-visitor-qr.png"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("QR code downloaded")
    } catch {
      toast.error("Failed to download QR code")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your visitor registration QR code
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="size-5" />
            Visitor Registration QR Code
          </CardTitle>
          <CardDescription>
            Print or display this QR code at your reception. Scanning it takes visitors to{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{appUrl}/visit</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <img
              src={qrUrl}
              alt="Visitor Registration QR Code"
              className="size-64"
              onError={() => toast.error("Failed to load QR code")}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={regenerateQr} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
            <Button onClick={downloadQr}>
              <Download className="size-4" />
              Download PNG
            </Button>
          </div>

          <p className="max-w-md text-center text-xs text-muted-foreground">
            The QR code uses high error correction, so the MSB Docs logo in the center
            won&apos;t affect scanning. You can safely print this at any size.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
