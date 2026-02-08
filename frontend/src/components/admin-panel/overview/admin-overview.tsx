"use client"

import {
  Alert01Icon,
  ArrowRight02Icon,
  Package,
  RefreshIcon,
  Settings02Icon,
  UserMultiple02Icon,
  Warehouse,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { type ReactNode, useCallback, useMemo } from "react"
import { getOccupancyPercentage } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import useAdminUsers from "@/hooks/use-admin-users"
import useAlerts from "@/hooks/use-alerts"
import useAssortments from "@/hooks/use-assortment"
import useWarehouses, { type WarehousesList } from "@/hooks/use-warehouses"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS, THRESHOLD } from "../lib/constants"
import { AdminStatCard } from "./stat-card"

type ApiWarehouse = WarehousesList["content"][number]

interface WarehouseSummary {
  id: number
  name: string
  used: number
  capacity: number
  racksCount: number
}

const mapWarehouseSummary = (warehouse: ApiWarehouse): WarehouseSummary => {
  const used = warehouse.occupiedSlots
  const capacity = warehouse.occupiedSlots + warehouse.freeSlots

  return {
    id: warehouse.id,
    name: warehouse.name,
    used,
    capacity,
    racksCount: warehouse.racksCount,
  }
}

const ADMIN_OVERVIEW_FETCH_SIZE = 1

export function AdminOverview() {
  const {
    data: usersData,
    isPending: isUsersPending,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useAdminUsers({
    size: ADMIN_OVERVIEW_FETCH_SIZE,
  })
  const {
    data: activeUsersData,
    isPending: isActiveUsersPending,
    isError: isActiveUsersError,
    refetch: refetchActiveUsers,
  } = useAdminUsers({
    size: ADMIN_OVERVIEW_FETCH_SIZE,
    status: "ACTIVE",
  })
  const isUsersStatsPending = isUsersPending || isActiveUsersPending
  const isUsersStatsError = isUsersError || isActiveUsersError
  const refetchUsersStats = useCallback(() => {
    refetchUsers()
    refetchActiveUsers()
  }, [refetchUsers, refetchActiveUsers])

  const {
    data: warehousesData,
    isPending: isWarehousesPending,
    isError: isWarehousesError,
    refetch: refetchWarehouses,
  } = useWarehouses({
    size: ADMIN_OVERVIEW_FETCH_SIZE,
  })
  const {
    data: assortmentsData,
    isPending: isAssortmentsPending,
    isError: isAssortmentsError,
    refetch: refetchAssortments,
  } = useAssortments({
    size: ADMIN_OVERVIEW_FETCH_SIZE,
  })
  const {
    data: alertsData,
    isPending: isAlertsPending,
    isError: isAlertsError,
    refetch: refetchAlerts,
  } = useAlerts({
    size: ADMIN_OVERVIEW_FETCH_SIZE,
  })
  const {
    data: openAlertsData,
    isPending: isOpenAlertsPending,
    isError: isOpenAlertsError,
  } = useAlerts({
    size: ADMIN_OVERVIEW_FETCH_SIZE,
    status: ["OPEN"],
  })

  const warehouses = useMemo(
    () => (warehousesData?.content ?? []).map(mapWarehouseSummary),
    [warehousesData?.content]
  )
  const isAlertsStatsPending = isAlertsPending || isOpenAlertsPending
  const isAlertsStatsError = isAlertsError || isOpenAlertsError

  const stats = useMemo(() => {
    const activeUsers = activeUsersData?.totalElements ?? 0
    const totalUsers = usersData?.totalElements ?? 0
    const totalWarehouses = warehousesData?.totalElements ?? warehouses.length
    const totalItems =
      assortmentsData?.totalElements ?? assortmentsData?.content.length ?? 0
    const openAlerts = openAlertsData?.totalElements ?? 0
    const totalAlerts = alertsData?.totalElements ?? 0

    return {
      users: { total: totalUsers, active: activeUsers },
      warehouses: { total: totalWarehouses },
      alerts: {
        open: openAlerts,
        total: totalAlerts,
      },
      items: { total: totalItems },
    }
  }, [
    activeUsersData?.totalElements,
    assortmentsData?.content.length,
    assortmentsData?.totalElements,
    alertsData?.totalElements,
    openAlertsData?.totalElements,
    usersData?.totalElements,
    warehouses,
    warehousesData?.totalElements,
  ])

  const criticalWarehouses = useMemo(() => {
    return warehouses.filter((warehouse) => {
      const occupancy = getOccupancyPercentage(
        warehouse.used,
        warehouse.capacity
      )
      return occupancy >= THRESHOLD
    })
  }, [warehouses])

  let criticalWarehousesContent: ReactNode

  if (isWarehousesPending) {
    criticalWarehousesContent = (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            className="relative overflow-hidden rounded-xl border bg-card p-5"
            key={i}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  } else if (isWarehousesError) {
    criticalWarehousesContent = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 border-dashed bg-destructive/5 py-12">
        <p className="font-medium text-foreground">
          Nie udało się pobrać danych magazynów
        </p>
        <button
          className="mt-3 flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
          onClick={() => refetchWarehouses()}
          type="button"
        >
          <HugeiconsIcon className="size-4" icon={RefreshIcon} />
          Ponów próbę
        </button>
      </div>
    )
  } else if (criticalWarehouses.length === 0) {
    criticalWarehousesContent = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-12">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
          <HugeiconsIcon className="size-6 text-emerald-500" icon={Warehouse} />
        </div>
        <p className="mt-4 font-medium text-foreground">Wszystko w porządku</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Brak magazynów wymagających natychmiastowej uwagi
        </p>
      </div>
    )
  } else {
    criticalWarehousesContent = (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {criticalWarehouses.map((warehouse) => {
          const occupancy = getOccupancyPercentage(
            warehouse.used,
            warehouse.capacity
          )

          return (
            <Link
              className="group block"
              href={`/admin/warehouses/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}`}
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
                        {warehouse.used} / {warehouse.capacity} miejsc zajętych
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
                        {warehouse.racksCount} regałów
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
    )
  }

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
          description={
            isUsersStatsPending ? undefined : `${stats.users.active} aktywnych`
          }
          href="/admin/users"
          icon={UserMultiple02Icon}
          isError={isUsersStatsError}
          isLoading={isUsersStatsPending}
          onRetry={refetchUsersStats}
          title="Użytkownicy"
          value={stats.users.total}
          variant="primary"
        />
        <AdminStatCard
          description="Wszystkie lokalizacje"
          href="/admin/warehouses"
          icon={Warehouse}
          isError={isWarehousesError}
          isLoading={isWarehousesPending}
          onRetry={() => refetchWarehouses()}
          title="Magazyny"
          value={stats.warehouses.total}
          variant="default"
        />
        <AdminStatCard
          description={
            isAssortmentsPending ? undefined : "We wszystkich magazynach"
          }
          href="/dashboard/items"
          icon={Package}
          isError={isAssortmentsError}
          isLoading={isAssortmentsPending}
          onRetry={() => refetchAssortments()}
          title="Przedmioty"
          value={stats.items.total}
          variant="success"
        />
        <AdminStatCard
          description={
            isAlertsStatsPending ? undefined : `${stats.alerts.total} łącznie`
          }
          href="/admin/alerts"
          icon={Alert01Icon}
          isError={isAlertsStatsError}
          isLoading={isAlertsStatsPending}
          onRetry={() => refetchAlerts()}
          title="Otwarte alerty"
          value={stats.alerts.open}
          variant={stats.alerts.open > 0 ? "warning" : "default"}
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

        {criticalWarehousesContent}
      </section>
    </div>
  )
}
