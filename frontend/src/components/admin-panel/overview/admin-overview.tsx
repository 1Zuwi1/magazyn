"use client"

import {
  Alert01Icon,
  Package,
  UserMultiple02Icon,
  Warehouse,
} from "@hugeicons/core-free-icons"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { THRESHOLD } from "../lib/constants"
import { countUnreadNotifications } from "../lib/utils"
import { StatCard } from "./stat-card"

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
    <div className="space-y-8 pt-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          description={`${stats.users.active} aktywnych`}
          href="/dashboard/admin/users"
          icon={UserMultiple02Icon}
          title="Użytkownicy"
          value={stats.users.total}
        />
        <StatCard
          href="/dashboard/admin/warehouses"
          icon={Warehouse}
          title="Magazyny"
          value={stats.warehouses.total}
        />
        <StatCard
          description="We wszystkich magazynach"
          href="/dashboard/items"
          icon={Package}
          title="Przedmioty"
          value={stats.items.total}
        />
        <StatCard
          description={`${stats.alerts.total} łącznie`}
          href="/dashboard/admin/notifications"
          icon={Alert01Icon}
          title="Nieprzeczytane alerty"
          value={stats.alerts.unread}
          variant={stats.alerts.unread > 0 ? "warning" : "default"}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl">Magazyny wymagające uwagi</h2>
          <Link
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            href="/dashboard/admin/warehouses"
          >
            Zobacz wszystkie
          </Link>
        </div>

        {criticalWarehouses.length === 0 ? (
          <p className="text-muted-foreground">
            Brak magazynów wymagających natychmiastowej uwagi.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {criticalWarehouses.map((warehouse) => {
              const occupancy = getOccupancyPercentage(
                warehouse.used,
                warehouse.capacity
              )

              return (
                <Card key={warehouse.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{warehouse.name}</CardTitle>
                      <Badge variant="destructive">
                        {Math.round(occupancy)}% pełny
                      </Badge>
                    </div>
                    <CardDescription>
                      {warehouse.used} / {warehouse.capacity} miejsc zajętych
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-destructive"
                          style={{ width: `${Math.min(occupancy, 100)}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {warehouse.racks.length} regałów
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      href={`/dashboard/warehouse/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}`}
                    >
                      Zarządzaj
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
