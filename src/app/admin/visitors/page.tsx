"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Visitor {
  id: string
  fullName: string
  email: string
  mobile: string
  photo?: string
  lastVisitPurpose?: string
  company?: string
  personToVisit?: string
  lastEntryTime?: string
  status?: "pending" | "checked-in" | "checked-out"
  visitCount?: number
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

const LIMIT = 20

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  "checked-in": "bg-green-100 text-green-800 border-green-300",
  "checked-out": "bg-gray-100 text-gray-600 border-gray-300",
}

function getInitials(name: string) {
  return (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function AdminVisitorsPage() {
  const router = useRouter()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [purpose, setPurpose] = useState("")
  const [company, setCompany] = useState("")
  const [hasGadget, setHasGadget] = useState(false)
  const [page, setPage] = useState(1)

  const fetchVisitors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("limit", String(LIMIT))
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)
      if (purpose) params.set("purpose", purpose)
      if (company) params.set("company", company)
      if (hasGadget) params.set("hasGadget", "true")

      const res = await fetch(`/api/visitors?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch visitors")
      const data = await res.json()

      setVisitors(data.visitors ?? data.data ?? [])
      setMeta(
        data.meta ?? {
          page,
          limit: LIMIT,
          total: data.total ?? 0,
          totalPages: data.totalPages ?? 0,
        }
      )
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load visitors"
      )
    } finally {
      setLoading(false)
    }
  }, [search, page, dateFrom, dateTo, purpose, company, hasGadget])

  useEffect(() => {
    fetchVisitors()
  }, [fetchVisitors])

  // Debounced search
  const [searchInput, setSearchInput] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  async function handleExport() {
    try {
      const res = await fetch("/api/visitors/export")
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `visitors-export-${format(new Date(), "yyyy-MM-dd")}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("Export downloaded")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Export failed"
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Visitors</h1>
          <p className="text-sm text-muted-foreground">
            Manage and view all visitors
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or mobile..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-4" />
            Filters
          </Button>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <Card>
            <CardContent className="flex flex-wrap items-end gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPage(1)
                  }}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setPage(1)
                  }}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Purpose</Label>
                <Input
                  placeholder="e.g. Meeting"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value)
                    setPage(1)
                  }}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Company</Label>
                <Input
                  placeholder="e.g. Acme Corp"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value)
                    setPage(1)
                  }}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2 pb-0.5">
                <Checkbox
                  checked={hasGadget}
                  onCheckedChange={(val) => {
                    setHasGadget(!!val)
                    setPage(1)
                  }}
                />
                <Label className="text-xs">Has Gadget</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom("")
                  setDateTo("")
                  setPurpose("")
                  setCompany("")
                  setHasGadget(false)
                  setPage(1)
                }}
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-8 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : visitors.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No visitors found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                  <TableHead className="hidden lg:table-cell">Purpose</TableHead>
                  <TableHead className="hidden lg:table-cell">Company</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Person to Visit
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Last Entry
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitors.map((visitor) => (
                  <TableRow
                    key={visitor.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/visitors/${visitor.id}`)}
                  >
                    <TableCell>
                      <Avatar size="sm">
                        {visitor.photo && (
                          <AvatarImage src={visitor.photo} alt={visitor.fullName} />
                        )}
                        <AvatarFallback>
                          {getInitials(visitor.fullName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {visitor.fullName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {visitor.email}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {visitor.mobile}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {visitor.lastVisitPurpose || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {visitor.company || "-"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {visitor.personToVisit || "-"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {visitor.lastEntryTime
                        ? format(
                            new Date(visitor.lastEntryTime),
                            "MMM d, yyyy h:mm a"
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {visitor.status ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor[visitor.status] ?? ""}`}
                        >
                          {visitor.status}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (visitor.visitCount ?? 0) > 1
                            ? "default"
                            : "secondary"
                        }
                      >
                        {(visitor.visitCount ?? 0) > 1
                          ? "Returning"
                          : "First-time"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
