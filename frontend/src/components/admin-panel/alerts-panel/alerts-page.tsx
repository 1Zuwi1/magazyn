"use client"

import {
  Alert01Icon,
  AlertCircleIcon,
  ArrowRight02Icon,
  CheckmarkBadge01Icon,
  FilterIcon,
  InboxIcon,
  Time01Icon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import {
  formatDateTime,
  toTitleCase,
} from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import PaginationFull from "@/components/ui/pagination-component"
import { ScrollArea } from "@/components/ui/scroll-area"
import useAlerts, { usePatchAlert } from "@/hooks/use-alerts"
import { getDateFnsLocale } from "@/i18n/date-fns-locale"
import type { AppTranslate } from "@/i18n/use-translations"
import type { InferApiOutput } from "@/lib/fetcher"
import {
  type AlertsSchema,
  type AlertType,
  findAlertTitle,
  getAlertTypeOptions,
} from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "../components/admin-page-header"

type AlertsList = InferApiOutput<typeof AlertsSchema, "GET">
type AlertItem = AlertsList["content"][number]
type DateFnsLocale = ReturnType<typeof getDateFnsLocale>

type AlertTypeValue = AlertType

type AlertStatusValue = "OPEN" | "ACTIVE" | "RESOLVED" | "DISMISSED"

const getAlertStatusOptions = (
  t: AppTranslate
): {
  value: AlertStatusValue
  label: string
}[] => [
  { value: "OPEN", label: t("generated.shared.open") },
  { value: "ACTIVE", label: t("generated.shared.active") },
  { value: "RESOLVED", label: t("generated.shared.solved") },
  {
    value: "DISMISSED",
    label: t("generated.admin.alerts.rejected"),
  },
]

function getAlertIcon(alertType: string): IconSvgElement {
  switch (alertType) {
    case "WEIGHT_EXCEEDED":
    case "RACK_OVERWEIGHT":
      return WeightScale01Icon
    default:
      return Alert01Icon
  }
}

function getStatusConfig(
  t: AppTranslate,
  status: string
): {
  badgeVariant: "default" | "destructive" | "secondary"
  cardClassName: string
  label: string
} {
  const normalizedStatus = status.toUpperCase()

  if (normalizedStatus === "OPEN" || normalizedStatus.includes("CRITICAL")) {
    return {
      badgeVariant: "destructive",
      cardClassName: "bg-destructive/10 text-destructive",
      label: t("generated.shared.open"),
    }
  }

  if (normalizedStatus === "RESOLVED" || normalizedStatus === "CLOSED") {
    return {
      badgeVariant: "secondary",
      cardClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      label: t("generated.shared.solved"),
    }
  }

  if (normalizedStatus === "DISMISSED") {
    return {
      badgeVariant: "secondary",
      cardClassName: "bg-muted text-muted-foreground",
      label: t("generated.admin.alerts.rejected"),
    }
  }

  if (normalizedStatus === "ACTIVE") {
    return {
      badgeVariant: "default",
      cardClassName: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      label: t("generated.shared.active"),
    }
  }

  return {
    badgeVariant: "default",
    cardClassName: "bg-muted text-muted-foreground",
    label: toTitleCase(status),
  }
}

const formatMetricValue = (value: number | null | undefined): string =>
  value == null ? "—" : value.toString()

const getLocationHref = (alert: AlertItem): string | null => {
  const warehouseId = alert.warehouseId
  const warehouseName = alert.warehouseName

  if (warehouseId == null || !warehouseName) {
    return null
  }

  return `/admin/warehouses/id/${warehouseId}/${warehouseName}`
}

function DetailsCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  )
}

function AlertListBody({
  isPending,
  isError,
  alerts,
  onSelect,
  selectedAlertId,
  dateFnsLocale,
}: {
  isPending: boolean
  isError: boolean
  alerts: AlertItem[]
  onSelect: (alert: AlertItem) => void
  selectedAlertId: number | null
  dateFnsLocale: DateFnsLocale
}) {
  const t = useTranslations()

  if (isPending) {
    return (
      <>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            className="h-20 animate-pulse rounded-lg border bg-muted/40"
            key={`alert-list-skeleton-${index}`}
          />
        ))}
      </>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="font-medium">
          {t("generated.admin.alerts.failedDownloadAlerts")}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("generated.shared.againMoment")}
        </p>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-6 text-muted-foreground"
            icon={InboxIcon}
          />
        </div>
        <p className="mt-3 font-medium">{t("generated.admin.alerts.alerts")}</p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("generated.shared.entriesSelectedFilter")}
        </p>
      </div>
    )
  }

  return (
    <>
      {alerts.map((alert) => {
        const statusConfig = getStatusConfig(t, alert.status)
        const isSelected = selectedAlertId === alert.id

        return (
          <button
            className={cn(
              "flex w-full gap-3 rounded-lg border p-3 text-left transition-all",
              isSelected
                ? "border-primary bg-primary/5"
                : "hover:border-primary/30 hover:bg-muted/50"
            )}
            key={alert.id}
            onClick={() => onSelect(alert)}
            type="button"
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                statusConfig.cardClassName
              )}
            >
              <HugeiconsIcon
                className="size-4"
                icon={getAlertIcon(alert.alertType)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-sm">
                  {findAlertTitle(alert, t)}
                </p>
                <Badge className="shrink-0" variant={statusConfig.badgeVariant}>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                {alert.message}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(alert.createdAt), {
                  addSuffix: true,
                  locale: dateFnsLocale,
                })}
              </p>
            </div>
          </button>
        )
      })}
    </>
  )
}

const getStatuses = (t: AppTranslate) => ({
  OPEN: {
    label: t("generated.admin.alerts.markOpen"),
    icon: Time01Icon,
  },
  ACTIVE: {
    label: t("generated.admin.alerts.markActive"),
    icon: AlertCircleIcon,
  },
  RESOLVED: {
    label: t("generated.admin.alerts.markSolved"),
    icon: CheckmarkBadge01Icon,
  },
  DISMISSED: {
    label: t("generated.admin.alerts.dismissAlert"),
    icon: Alert01Icon,
  },
})

function AlertDetailsPanel({
  alert,
  onStatusChange,
}: {
  alert: AlertItem | null
  onStatusChange: (status: AlertStatusValue) => void
}) {
  const locale = useLocale()
  const t = useTranslations()
  const statuses = useMemo(() => getStatuses(t), [t])

  if (!alert) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-8 text-muted-foreground"
            icon={Alert01Icon}
          />
        </div>
        <p className="mt-4 font-medium text-lg">
          {t("generated.admin.alerts.selectAlert")}
        </p>
        <p className="mt-1 text-center text-muted-foreground text-sm">
          {t("generated.shared.clickEntryListSeeDetails")}
        </p>
      </div>
    )
  }

  const statusConfig = getStatusConfig(t, alert.status)
  const differenceValue =
    alert.actualValue != null && alert.thresholdValue != null
      ? alert.actualValue - alert.thresholdValue
      : null
  const locationHref = getLocationHref(alert)
  const hasResolutionData = Boolean(
    alert.resolvedByName || alert.resolutionNotes
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/20 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusConfig.badgeVariant}>
            {statusConfig.label}
          </Badge>
        </div>
        <h2 className="mt-3 font-semibold text-xl">
          {findAlertTitle(alert, t)}
        </h2>
        <p className="mt-1 text-muted-foreground">{alert.message}</p>
      </div>

      <div className="flex-1 space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">
            {t("generated.shared.location")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailsCard
              label={t("generated.shared.warehouse")}
              value={alert.warehouseName ?? alert.warehouseId ?? "—"}
            />
            <DetailsCard
              label={t("generated.shared.rack")}
              value={alert.rackMarker ?? alert.rackId ?? "—"}
            />
            <DetailsCard
              label={t("generated.shared.status")}
              value={getStatusConfig(t, alert.status).label}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">
            {t("generated.shared.metrics")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailsCard
              label={t("generated.shared.threshold")}
              value={formatMetricValue(alert.thresholdValue)}
            />
            <DetailsCard
              label={t("generated.shared.value")}
              value={formatMetricValue(alert.actualValue)}
            />
            <DetailsCard
              label={t("generated.shared.difference")}
              value={differenceValue == null ? "—" : differenceValue.toString()}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">
            {t("generated.shared.time")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailsCard
              label={t("generated.shared.created")}
              value={formatDateTime(alert.createdAt.toISOString(), locale)}
            />
            <DetailsCard
              label={t("generated.admin.alerts.update")}
              value={
                alert.updatedAt
                  ? formatDateTime(alert.updatedAt.toISOString(), locale)
                  : "—"
              }
            />
            <DetailsCard
              label={t("generated.admin.alerts.solved")}
              value={
                alert.resolvedAt
                  ? formatDateTime(alert.resolvedAt.toISOString(), locale)
                  : "—"
              }
            />
          </div>
        </section>

        {hasResolutionData ? (
          <section className="space-y-3">
            <h3 className="font-medium text-muted-foreground text-sm">
              {t("generated.shared.solutionNote")}
            </h3>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-muted-foreground text-xs">
                {t("generated.shared.solved2")}
              </p>
              <p className="mt-0.5 font-medium">
                {alert.resolvedByName ?? "—"}
              </p>
              {alert.resolutionNotes ? (
                <p className="mt-2 text-sm">{alert.resolutionNotes}</p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t bg-muted/20 p-4">
        {locationHref ? (
          <Link
            className={buttonVariants({
              variant: "outline",
              size: "sm",
            })}
            href={locationHref}
          >
            {t("generated.shared.goLocation")}
            <HugeiconsIcon className="ml-2 size-4" icon={ArrowRight02Icon} />
          </Link>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({
                size: "sm",
                variant: "default",
              })
            )}
          >
            {t("generated.admin.shared.changeStatus")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-fit" side="top">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {t("generated.shared.actions")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(statuses).map(([status, config]) => (
                <DropdownMenuItem
                  className="gap-2"
                  key={status}
                  onClick={() => onStatusChange(status as AlertStatusValue)}
                >
                  <HugeiconsIcon className="size-4" icon={config.icon} />
                  {config.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default function AlertsMain() {
  const t = useTranslations()
  const alertStatusOptions = useMemo(() => getAlertStatusOptions(t), [t])
  const alertTypeOptions = useMemo(() => getAlertTypeOptions(t), [t])

  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)

  const [alertTypeFilter, setAlertTypeFilter] = useState<AlertTypeValue[]>([])
  const [statusFilter, setStatusFilter] = useState<AlertStatusValue[]>([])
  const [page, setPage] = useState(0)
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null)

  const patchAlert = usePatchAlert()

  const { data: activeAlerts } = useAlerts({
    page: 0,
    size: 1,
    status: ["OPEN", "ACTIVE"],
  })

  const { data: allAlerts } = useAlerts({
    page: 0,
    size: 1,
  })

  const alertsQuery = useAlerts({
    page,
    sortBy: "createdAt",
    sortDir: "desc",
    type: alertTypeFilter.length > 0 ? alertTypeFilter : undefined,
    status: statusFilter.length > 0 ? statusFilter : undefined,
  })

  const alertsData = alertsQuery.data
  const alerts = alertsData?.content ?? []
  const isAlertsPending = alertsQuery.isPending
  const isAlertsError = alertsQuery.isError

  useEffect(() => {
    setSelectedAlertId((currentSelection) => {
      if (alerts.length === 0) {
        return null
      }

      if (
        currentSelection != null &&
        alerts.some((alert) => alert.id === currentSelection)
      ) {
        return currentSelection
      }

      return alerts[0]?.id ?? null
    })
  }, [alerts])

  const selectedAlert = useMemo(
    () => alerts.find((alert) => alert.id === selectedAlertId) ?? null,
    [alerts, selectedAlertId]
  )

  const currentPage = (alertsData?.page ?? page) + 1
  const totalPages = alertsData?.totalPages ?? 1

  const handleSelectAlert = (alert: AlertItem) => {
    setSelectedAlertId(alert.id)
  }

  const handleStatusChange = (status: AlertStatusValue) => {
    if (!selectedAlert) {
      return
    }

    patchAlert.mutate({
      alertIds: [selectedAlert.id],
      status,
    })
  }

  const handleToggleAlertType = (alertType: AlertTypeValue) => {
    setAlertTypeFilter((previous) =>
      previous.includes(alertType)
        ? previous.filter((t) => t !== alertType)
        : [...previous, alertType]
    )
    setPage(0)
  }

  const handleClearAlertTypeFilter = () => {
    setAlertTypeFilter([])
    setPage(0)
  }

  const handleToggleStatus = (status: AlertStatusValue) => {
    setStatusFilter((previous) =>
      previous.includes(status)
        ? previous.filter((s) => s !== status)
        : [...previous, status]
    )
    setPage(0)
  }

  const handleClearStatusFilter = () => {
    setStatusFilter([])
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description={t("generated.admin.alerts.viewSystemAlertsWarehouses")}
        icon={Alert01Icon}
        title={t("generated.shared.alerts")}
      >
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="font-mono font-semibold text-primary">
              {allAlerts?.totalElements ?? 0}
            </span>
            <span className="text-muted-foreground text-xs">
              {t("generated.shared.together")}
            </span>
          </div>
          {(activeAlerts?.totalElements ?? 0) > 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-1.5">
              <span className="flex size-2 rounded-full bg-destructive" />
              <span className="font-mono font-semibold text-destructive">
                {activeAlerts?.totalElements ?? 0}
              </span>
              <span className="text-muted-foreground text-xs">
                {t("generated.admin.alerts.open")}
              </span>
            </div>
          ) : null}
        </div>
      </AdminPageHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b bg-muted/30 p-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-muted",
                    statusFilter.length > 0 && "text-primary"
                  )}
                >
                  <HugeiconsIcon className="size-4" icon={FilterIcon} />
                  {t("generated.shared.status")}
                  {statusFilter.length > 0 && (
                    <Badge className="ml-1" variant="secondary">
                      {statusFilter.length}
                    </Badge>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-48"
                  side="bottom"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {t("generated.admin.alerts.filterStatus")}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {alertStatusOptions.map((option) => (
                      <DropdownMenuCheckboxItem
                        checked={statusFilter.includes(option.value)}
                        key={option.value}
                        onClick={() => handleToggleStatus(option.value)}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {statusFilter.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <button
                          className="w-full rounded-sm px-2 py-1.5 text-center text-muted-foreground text-sm hover:bg-muted"
                          onClick={handleClearStatusFilter}
                          type="button"
                        >
                          {t("generated.shared.clearFilters")}
                        </button>
                      </>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-muted",
                    alertTypeFilter.length > 0 && "text-primary"
                  )}
                >
                  <HugeiconsIcon className="size-4" icon={FilterIcon} />
                  {t("generated.admin.alerts.alertType")}
                  {alertTypeFilter.length > 0 && (
                    <Badge className="ml-1" variant="secondary">
                      {alertTypeFilter.length}
                    </Badge>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-64"
                  side="bottom"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {t("generated.admin.alerts.filterAlertType")}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {alertTypeOptions.map((option) => (
                      <DropdownMenuCheckboxItem
                        checked={alertTypeFilter.includes(option.value)}
                        key={option.value}
                        onClick={() => handleToggleAlertType(option.value)}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {alertTypeFilter.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <button
                          className="w-full rounded-sm px-2 py-1.5 text-center text-muted-foreground text-sm hover:bg-muted"
                          onClick={handleClearAlertTypeFilter}
                          type="button"
                        >
                          {t("generated.shared.clearFilters")}
                        </button>
                      </>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ScrollArea className="h-112">
              <div className="space-y-2 p-2">
                <AlertListBody
                  alerts={alerts}
                  dateFnsLocale={dateFnsLocale}
                  isError={isAlertsError}
                  isPending={isAlertsPending}
                  onSelect={handleSelectAlert}
                  selectedAlertId={selectedAlertId}
                />
              </div>
            </ScrollArea>

            <PaginationFull
              currentPage={currentPage}
              setPage={setPage}
              totalPages={totalPages}
              variant="compact"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <AlertDetailsPanel
            alert={selectedAlert}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      {selectedAlert ? (
        <div className="rounded-lg border border-dashed p-3 text-muted-foreground text-xs">
          <HugeiconsIcon className="mr-1 inline size-3.5" icon={Time01Icon} />
          {t("generated.shared.lastUpdated", {
            value0: formatDateTime(
              selectedAlert.updatedAt?.toString() ?? "—",
              locale
            ),
          })}
        </div>
      ) : null}
    </div>
  )
}
