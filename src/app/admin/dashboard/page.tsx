"use client"

import { useEffect, useState } from "react"
import {
  Users,
  CalendarCheck,
  Activity,
  Repeat,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DashboardStats } from "@/components/dashboard-stats"

interface Stats {
  totalVisitors: number
  todayCheckIns: number
  activeVisits: number
  repeatVisitors: number
}

interface RecentVisit {
  id: string
  visitorName: string
  company: string
  personToVisit: string
  purpose: string
  entryTime: string
  status: "pending" | "checked-in" | "checked-out"
}

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  pending: "outline",
  "checked-in": "default",
  "checked-out": "secondary",
}

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  "checked-in": "bg-green-100 text-green-800 border-green-300",
  "checked-out": "bg-gray-100 text-gray-600 border-gray-300",
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/stats")
        if (!res.ok) throw new Error("Failed to load dashboard data")
        const data = await res.json()
        setStats({
          totalVisitors: data.totalVisitors ?? 0,
          todayCheckIns: data.todayCheckIns ?? 0,
          activeVisits: data.activeVisits ?? 0,
          repeatVisitors: data.repeatVisitors ?? 0,
        })
        setRecentVisits(data.recentVisits ?? [])
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load dashboard"
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const kpis = [
    {
      title: "Total Visitors",
      value: stats?.totalVisitors ?? 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Today's Check-ins",
      value: stats?.todayCheckIns ?? 0,
      icon: CalendarCheck,
      color: "bg-green-500",
    },
    {
      title: "Active Visits",
      value: stats?.activeVisits ?? 0,
      icon: Activity,
      color: "bg-orange-500",
    },
    {
      title: "Repeat Visitors",
      value: stats?.repeatVisitors ?? 0,
      icon: Repeat,
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of visitor activity
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <DashboardStats
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            loading={loading}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : recentVisits.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No recent activity
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitor Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Person to Visit</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-medium">
                      {visit.visitorName}
                    </TableCell>
                    <TableCell>{visit.company || "-"}</TableCell>
                    <TableCell>{visit.personToVisit}</TableCell>
                    <TableCell>{visit.purpose}</TableCell>
                    <TableCell>
                      {visit.entryTime
                        ? format(new Date(visit.entryTime), "MMM d, yyyy h:mm a")
                        : "-"}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
