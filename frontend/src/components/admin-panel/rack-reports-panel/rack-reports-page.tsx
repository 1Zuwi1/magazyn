"use client"

import {
  FilterIcon,
  PackageIcon,
  ThermometerIcon,
  WarehouseIcon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { useMemo, useState } from "react"
import type { IconComponent } from "@/components/dashboard/types"
import { formatDateTime } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import PaginationFull from "@/components/ui/pagination-component"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import useRackReports from "@/hooks/use-rack-reports"
import { useAppTranslations } from "@/i18n/use-translations"
import type { InferApiOutput } from "@/lib/fetcher"
import type { RackReportsSchema } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "../components/admin-page-header"

type RackReportsList = InferApiOutput<typeof RackReportsSchema, "GET">
type RackReportItem = RackReportsList["content"][number]

const RACK_REPORTS_PAGE_SIZE = 20

type MetricValue = number | string | null | undefined

const formatValue = (value: MetricValue): string =>
  value == null ? "—" : value.toString()

function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string
  value: MetricValue
  unit?: string
  icon: IconComponent
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <HugeiconsIcon className="size-3.5" icon={Icon} />
        <span>{label}</span>
      </div>
      <p className="mt-1 font-semibold">
        {formatValue(value)}{" "}
        {unit && (
          <span className="font-normal text-muted-foreground">{unit}</span>
        )}
      </p>
    </div>
  )
}

function RackReportListBody({
  isPending,
  isError,
  reports,
  onSelect,
  selectedReportId,
}: {
  isPending: boolean
  isError: boolean
  reports: RackReportItem[]
  onSelect: (report: RackReportItem) => void
  selectedReportId: number | null
}) {
  const t = useAppTranslations()
  const locale = useLocale()

  if (isPending) {
    return (
      <>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton
            className="h-20 rounded-lg"
            key={`report-list-skeleton-${index}`}
          />
        ))}
      </>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="font-medium">
          {t("generated.admin.rackReports.failedDownloadReports")}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("generated.shared.againMoment")}
        </p>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-6 text-muted-foreground"
            icon={PackageIcon}
          />
        </div>
        <p className="mt-3 font-medium">
          {t("generated.admin.rackReports.reports")}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("generated.shared.entriesSelectedFilter")}
        </p>
      </div>
    )
  }

  return (
    <>
      {reports.map((report) => {
        const isSelected = selectedReportId === report.id

        return (
          <button
            className={cn(
              "flex w-full gap-3 rounded-lg border p-3 text-left transition-all",
              isSelected
                ? "border-primary bg-primary/5"
                : "hover:border-primary/30 hover:bg-muted/50"
            )}
            key={report.id}
            onClick={() => onSelect(report)}
            type="button"
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                report.alertTriggered
                  ? "bg-destructive/10 text-destructive"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}
            >
              <HugeiconsIcon
                className="size-4"
                icon={report.alertTriggered ? WeightScale01Icon : PackageIcon}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-sm">
                  {report.rackMarker}
                </p>
                <Badge
                  className="shrink-0"
                  variant={report.alertTriggered ? "destructive" : "secondary"}
                >
                  {report.alertTriggered
                    ? t("generated.admin.rackReports.alert2")
                    : t("generated.admin.rackReports.ok")}
                </Badge>
              </div>
              <p className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
                {report.warehouseName}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatDateTime(report.createdAt, locale)}
              </p>
            </div>
          </button>
        )
      })}
    </>
  )
}

function RackReportDetailsPanel({ report }: { report: RackReportItem | null }) {
  const t = useAppTranslations()
  const locale = useLocale()

  if (!report) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-8 text-muted-foreground"
            icon={PackageIcon}
          />
        </div>
        <p className="mt-4 font-medium text-lg">
          {t("generated.admin.rackReports.selectReport")}
        </p>
        <p className="mt-1 text-center text-muted-foreground text-sm">
          {t("generated.shared.clickEntryListSeeDetails")}
        </p>
      </div>
    )
  }

  const warehouseHref = `/admin/warehouses/id/${report.warehouseId}/${encodeURIComponent(report.warehouseName)}`

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/20 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={report.alertTriggered ? "destructive" : "secondary"}>
            {report.alertTriggered
              ? t("generated.admin.rackReports.alertActivated")
              : t("generated.admin.rackReports.allOk")}
          </Badge>
        </div>
        <h2 className="mt-3 font-semibold text-xl">{report.rackMarker}</h2>
        <p className="mt-1 text-muted-foreground">{report.warehouseName}</p>
      </div>

      <div className="flex-1 space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">
            {t("generated.shared.location")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              icon={WarehouseIcon}
              label={t("generated.shared.warehouse")}
              value={report.warehouseName}
            />
            <MetricCard
              icon={PackageIcon}
              label={t("generated.shared.rack")}
              value={report.rackMarker}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">
            {t("generated.shared.metrics")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              icon={WeightScale01Icon}
              label={t("generated.admin.rackReports.currentWeight")}
              unit="kg"
              value={report.currentWeight}
            />
            <MetricCard
              icon={ThermometerIcon}
              label={t("generated.shared.temperature")}
              unit="°C"
              value={report.currentTemperature}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">
            {t("generated.admin.rackReports.information")}
          </h3>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-muted-foreground text-xs">
              {t("generated.admin.rackReports.sensorId")}
            </p>
            <p className="mt-0.5 font-medium font-mono">{report.sensorId}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-muted-foreground text-xs">
              {t("generated.shared.created")}
            </p>
            <p className="mt-0.5 font-medium">
              {formatDateTime(report.createdAt, locale)}
            </p>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t bg-muted/20 p-4">
        <Link
          className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 font-medium text-sm transition-colors hover:bg-muted"
          href={warehouseHref}
        >
          {t("generated.admin.rackReports.goWarehouse")}
        </Link>
      </div>
    </div>
  )
}

export default function RackReportsMain() {
  const t = useAppTranslations()

  const [withAlertsFilter, setWithAlertsFilter] = useState<boolean | undefined>(
    undefined
  )
  const [page, setPage] = useState(1)
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)

  const reportsQuery = useRackReports({
    page: page - 1,
    size: RACK_REPORTS_PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
    withAlerts: withAlertsFilter,
  })

  const reportsData = reportsQuery.data
  const reports = reportsData?.content ?? []
  const isReportsPending = reportsQuery.isPending
  const isReportsError = reportsQuery.isError
  const totalReports = reportsData?.totalElements ?? 0

  const alertReportsQuery = useRackReports({
    page: 0,
    size: 1,
    sortBy: "createdAt",
    sortDir: "desc",
    withAlerts: true,
  })

  const alertCount = alertReportsQuery.data?.totalElements ?? 0

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId]
  )

  const totalPages = reportsData?.totalPages ?? 1

  const handleSelectReport = (report: RackReportItem) => {
    setSelectedReportId(report.id)
  }

  const handleToggleAlertsFilter = (value: boolean) => {
    setWithAlertsFilter((previous) => (previous === value ? undefined : value))
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description={t("generated.admin.rackReports.viewRackSensorReports")}
        icon={PackageIcon}
        title={t("generated.shared.rackReports")}
      >
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="font-mono font-semibold text-primary">
              {totalReports}
            </span>
            <span className="text-muted-foreground text-xs">
              {t("generated.shared.together")}
            </span>
          </div>
          {alertCount > 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-1.5">
              <span className="flex size-2 rounded-full bg-destructive" />
              <span className="font-mono font-semibold text-destructive">
                {alertCount}
              </span>
              <span className="text-muted-foreground text-xs">
                {t("generated.admin.rackReports.alert")}
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
                    withAlertsFilter !== undefined && "text-primary"
                  )}
                >
                  <HugeiconsIcon className="size-4" icon={FilterIcon} />
                  {t("generated.admin.rackReports.filters")}
                  {withAlertsFilter !== undefined && (
                    <Badge className="ml-1" variant="secondary">
                      {withAlertsFilter
                        ? t("generated.admin.rackReports.only")
                        : t("generated.admin.rackReports.all")}
                    </Badge>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="bottom">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {t("generated.admin.rackReports.filterAlerts")}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={withAlertsFilter === true}
                      className="text-nowrap"
                      onClick={() => handleToggleAlertsFilter(true)}
                    >
                      {t("generated.admin.rackReports.onlyAlerts")}
                    </DropdownMenuCheckboxItem>
                    {withAlertsFilter !== undefined && (
                      <>
                        <DropdownMenuSeparator />
                        <button
                          className="w-full rounded-sm px-2 py-1.5 text-center text-muted-foreground text-sm hover:bg-muted"
                          onClick={() => setWithAlertsFilter(undefined)}
                          type="button"
                        >
                          {t("generated.admin.rackReports.cleanFilter")}
                        </button>
                      </>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ScrollArea className="h-112">
              <div className="space-y-2 p-2">
                <RackReportListBody
                  isError={isReportsError}
                  isPending={isReportsPending}
                  onSelect={handleSelectReport}
                  reports={reports}
                  selectedReportId={selectedReportId}
                />
              </div>
            </ScrollArea>

            <PaginationFull
              className="border-t"
              currentPage={page}
              setPage={setPage}
              totalPages={totalPages}
              variant="compact"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <RackReportDetailsPanel report={selectedReport} />
        </div>
      </div>
    </div>
  )
}
