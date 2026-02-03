"use client"

import {
  Alert01Icon,
  ArrowRight02Icon,
  Package,
  Settings02Icon,
  UserMultiple02Icon,
  Warehouse,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useMemo } from "react"
import {
  MOCK_NOTIFICATIONS,
  MOCK_USERS,
  MOCK_WAREHOUSES,
} from "@/components/dashboard/mock-data"
import { getOccupancyPercentage } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS, THRESHOLD } from "../lib/constants"
import { countUnreadNotifications } from "../lib/utils"
import { AdminStatCard } from "./stat-card"

export function AdminOverview() {
  const stats = useMemo(() => {
    const activeUsers = MOCK_USERS.filter(
      (user) => user.status === "active"
    ).length
    const totalItems = MOCK_WAREHOUSES.reduce(
      (sum, warehouse) =>
        sum +
        warehouse.racks.reduce(
          (rackSum, rack) => rackSum + rack.items.length,
          0
        ),
      0
    )
    return {
      users: { total: MOCK_USERS.length, active: activeUsers },
      warehouses: { total: MOCK_WAREHOUSES.length },
      alerts: {
        unread: countUnreadNotifications(MOCK_NOTIFICATIONS),
        total: MOCK_NOTIFICATIONS.length,
      },
      items: { total: totalItems },
    }
  }, [])

  const criticalWarehouses = useMemo(() => {
    return MOCK_WAREHOUSES.filter((warehouse) => {
      const occupancy = getOccupancyPercentage(
        warehouse.used,
        warehouse.capacity
      )
      return occupancy >= THRESHOLD
    })
  }, [])

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <AdminPageHeader
        description="Zarządzaj użytkownikami, magazynami i powiadomieniami systemowymi"
        icon={Settings02Icon}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Panel administracyjny"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          description={`${stats.users.active} aktywnych`}
          href="/admin/users"
          icon={UserMultiple02Icon}
          title="Użytkownicy"
          value={stats.users.total}
          variant="primary"
        />
        <AdminStatCard
          description="Wszystkie lokalizacje"
          href="/admin/warehouses"
          icon={Warehouse}
          title="Magazyny"
          value={stats.warehouses.total}
          variant="default"
        />
        <AdminStatCard
          description="We wszystkich magazynach"
          href="/dashboard/items"
          icon={Package}
          title="Przedmioty"
          value={stats.items.total}
          variant="success"
        />
        <AdminStatCard
          description={`${stats.alerts.total} łącznie`}
          href="/admin/notifications"
          icon={Alert01Icon}
          title="Nieprzeczytane alerty"
          value={stats.alerts.unread}
          variant={stats.alerts.unread > 0 ? "warning" : "default"}
        />
      </div>

      {/* Critical Warehouses Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-semibold text-xl tracking-tight">
              Magazyny wymagające uwagi
            </h2>
            <p className="text-muted-foreground text-sm">
              Magazyny z zapełnieniem powyżej {THRESHOLD}%
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href="/admin/warehouses"
          >
            Zobacz wszystkie
            <HugeiconsIcon className="ml-2 size-4" icon={ArrowRight02Icon} />
          </Link>
        </div>

        {criticalWarehouses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
              <HugeiconsIcon
                className="size-6 text-emerald-500"
                icon={Warehouse}
              />
            </div>
            <p className="mt-4 font-medium text-foreground">
              Wszystko w porządku
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              Brak magazynów wymagających natychmiastowej uwagi
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {criticalWarehouses.map((warehouse) => {
              const occupancy = getOccupancyPercentage(
                warehouse.used,
                warehouse.capacity
              )

              return (
                <Link
                  className="group block"
                  href={`/dashboard/warehouse/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}`}
                  key={warehouse.id}
                >
                  <div className="relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:border-destructive/30 hover:shadow-md">
                    {/* Decorative warning gradient */}
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-destructive/5 via-transparent to-transparent opacity-50" />

                    {/* Warning indicator line */}
                    <div className="absolute top-0 left-0 h-1 w-full bg-destructive opacity-60" />

                    <div className="relative space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg group-hover:text-destructive">
                            {warehouse.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {warehouse.used} / {warehouse.capacity} miejsc
                            zajętych
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {Math.round(occupancy)}%
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-destructive transition-all"
                            style={{ width: `${Math.min(occupancy, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {warehouse.racks.length} regałów
                          </span>
                          <span
                            className={cn(
                              "font-medium",
                              occupancy >= 95
                                ? "text-destructive"
                                : "text-orange-500"
                            )}
                          >
                            {occupancy >= 95 ? "Krytyczne" : "Wysokie"}
                          </span>
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      <div className="flex justify-end">
                        <div className="flex size-7 items-center justify-center rounded-full bg-muted/50 opacity-0 transition-all group-hover:opacity-100">
                          <HugeiconsIcon
                            className="size-4 text-muted-foreground"
                            icon={ArrowRight02Icon}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
