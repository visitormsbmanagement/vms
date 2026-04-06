"use client"

import { type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface DashboardStatsProps {
  title: string
  value: number
  icon: LucideIcon
  color: string
  loading?: boolean
}

export function DashboardStats({
  title,
  value,
  icon: Icon,
  color,
  loading = false,
}: DashboardStatsProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            color
          )}
        >
          <Icon className="size-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <div className="mt-1 h-8 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
