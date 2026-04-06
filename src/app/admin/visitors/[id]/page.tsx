"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  LogIn,
  LogOut,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Visit {
  id: string
  purpose: string
  company?: string
  personToVisit: string
  tagNumber?: string
  idProof?: string
  idProofPhoto?: string
  gadgetInfo?: string
  entryTime?: string
  checkInTime?: string
  checkOutTime?: string
  status: "pending" | "checked-in" | "checked-out"
}

interface VisitorDetail {
  id: string
  fullName: string
  title?: string
  email: string
  mobile: string
  address?: string
  photo?: string
  memberSince?: string
  lastLoginDate?: string
  visits: Visit[]
}

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  "checked-in": "bg-green-100 text-green-800 border-green-300",
  "checked-out": "bg-gray-100 text-gray-600 border-gray-300",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-"
  return format(new Date(dateStr), "MMM d, yyyy h:mm a")
}

export default function VisitorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [visitor, setVisitor] = useState<VisitorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  async function fetchVisitor() {
    try {
      const res = await fetch(`/api/visitors/${id}`)
      if (!res.ok) throw new Error("Visitor not found")
      const data = await res.json()
      setVisitor(data)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load visitor"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchVisitor()
  }, [id])

  const latestVisit = visitor?.visits?.[0]

  async function handleCheckIn() {
    if (!latestVisit) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/visits/check-in", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: latestVisit.id }),
      })
      if (!res.ok) throw new Error("Check-in failed")
      toast.success("Visitor checked in")
      await fetchVisitor()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Check-in failed"
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCheckOut() {
    if (!latestVisit) return
    setActionLoading(true)
    try {
      const res = await fetch("/api/visits/check-out", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: latestVisit.id }),
      })
      if (!res.ok) throw new Error("Check-out failed")
      toast.success("Visitor checked out")
      await fetchVisitor()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Check-out failed"
      )
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!visitor) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-muted-foreground">Visitor not found</p>
        <Button variant="outline" onClick={() => router.push("/admin/visitors")}>
          <ArrowLeft className="size-4" />
          Back to visitors
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/visitors")}
        >
          <ArrowLeft className="size-4" />
          Back to visitors
        </Button>
        <div className="flex gap-2">
          {latestVisit?.status === "pending" && (
            <Button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              Check In
            </Button>
          )}
          {latestVisit?.status === "checked-in" && (
            <Button
              variant="outline"
              onClick={handleCheckOut}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Check Out
            </Button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <Avatar className="size-[120px]">
            {visitor.photo && (
              <AvatarImage src={visitor.photo} alt={visitor.fullName} />
            )}
            <AvatarFallback className="text-2xl">
              {getInitials(visitor.fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-3 text-center sm:text-left">
            <div>
              <h2 className="font-heading text-xl font-bold">
                {visitor.fullName}
              </h2>
              {visitor.title && (
                <p className="text-sm text-muted-foreground">{visitor.title}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Mail className="size-4 text-muted-foreground" />
                <span>{visitor.email}</span>
              </div>
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Phone className="size-4 text-muted-foreground" />
                <span>{visitor.mobile}</span>
              </div>
              {visitor.address && (
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{visitor.address}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground sm:justify-start">
              {visitor.memberSince && (
                <div className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  Member since{" "}
                  {format(new Date(visitor.memberSince), "MMM d, yyyy")}
                </div>
              )}
              {visitor.lastLoginDate && (
                <div className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  Last seen{" "}
                  {formatDistanceToNow(new Date(visitor.lastLoginDate), {
                    addSuffix: true,
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit History */}
      <Card>
        <CardHeader>
          <CardTitle>Visit History</CardTitle>
          <CardDescription>
            {visitor.visits.length} visit
            {visitor.visits.length !== 1 ? "s" : ""} on record
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {visitor.visits.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No visits recorded
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Tag No.
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      ID Proof
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      ID Photo
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Gadget
                    </TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Check-in
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Check-out
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitor.visits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">
                        {visit.purpose}
                      </TableCell>
                      <TableCell>{visit.company || "-"}</TableCell>
                      <TableCell>{visit.personToVisit}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {visit.tagNumber || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {visit.idProof || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {visit.idProofPhoto ? (
                          <a
                            href={visit.idProofPhoto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src={visit.idProofPhoto}
                              alt="ID Proof"
                              className="h-10 w-14 rounded border object-cover hover:opacity-80"
                            />
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {visit.gadgetInfo || "-"}
                      </TableCell>
                      <TableCell>{formatDate(visit.entryTime)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDate(visit.checkInTime)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatDate(visit.checkOutTime)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor[visit.status] ?? ""}`}
                        >
                          {visit.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
