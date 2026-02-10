"use client"

import {
  Analytics01Icon,
  Calendar03Icon,
  Cancel01Icon,
  PackageIcon,
  PackageReceiveIcon,
  Time01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"
import { useLocale } from "next-intl"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  EmptyState,
  ErrorEmptyState,
  FilterEmptyState,
} from "@/components/ui/empty-state"
import PaginationFull from "@/components/ui/pagination-component"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useAuditInboundOperations,
  useAuditOutboundOperations,
} from "@/hooks/use-audit"
import { getDateFnsLocale } from "@/i18n/date-fns-locale"
import { translateMessage } from "@/i18n/translate-message"
import type { InferApiOutput } from "@/lib/fetcher"
import type {
  AuditInboudOperationsSchema,
  AuditOutboundOperationsSchema,
} from "@/lib/schemas"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"

type InboundList = InferApiOutput<typeof AuditInboudOperationsSchema, "GET">
type InboundOperation = InboundList["content"][number]

type OutboundList = InferApiOutput<typeof AuditOutboundOperationsSchema, "GET">
type OutboundOperation = OutboundList["content"][number]
type DateFnsLocale = ReturnType<typeof getDateFnsLocale>

const PAGE_SIZE = 20

const formatDateTime = (date: string, dateFnsLocale: DateFnsLocale): string => {
  try {
    return format(new Date(date), "dd MMM yyyy, HH:mm", {
      locale: dateFnsLocale,
    })
  } catch {
    return "\u2014"
  }
}

function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onClear: () => void
}) {
  const hasFilter = startDate !== "" || endDate !== ""

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <HugeiconsIcon className="size-3.5" icon={Calendar03Icon} />
        <span className="hidden text-xs sm:inline">
          {translateMessage("generated.m0184")}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <DatePicker
          date={startDate ? new Date(startDate) : undefined}
          onDateChange={onStartDateChange}
        />
        <span className="text-muted-foreground text-xs">&ndash;</span>
        <DatePicker
          date={endDate ? new Date(endDate) : undefined}
          onDateChange={onEndDateChange}
          setTimeToEndOfDay
        />
      </div>
      {hasFilter && (
        <Button
          className="size-6 text-muted-foreground hover:text-destructive"
          onClick={onClear}
          size="icon-xs"
          variant="ghost"
        >
          <HugeiconsIcon className="size-3" icon={Cancel01Icon} />
        </Button>
      )}
    </div>
  )
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <TableCell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function InboundTableContent({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearDates,
  dateFnsLocale,
}: {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onClearDates: () => void
  dateFnsLocale: DateFnsLocale
}) {
  const [page, setPage] = useState(1)

  const query = useAuditInboundOperations({
    page: page - 1,
    size: PAGE_SIZE,
    sortBy: "operationTimestamp",
    sortDir: "desc",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const operations = query.data?.content ?? []
  const totalPages = query.data?.totalPages ?? 1
  const totalElements = query.data?.totalElements ?? 0

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        <DateRangeFilter
          endDate={endDate}
          onClear={onClearDates}
          onEndDateChange={onEndDateChange}
          onStartDateChange={onStartDateChange}
          startDate={startDate}
        />
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-primary text-sm tabular-nums">
            {totalElements}
          </span>
          <span className="text-muted-foreground text-xs">
            {translateMessage("generated.m0903", {
              value0: totalElements,
            })}
          </span>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>{translateMessage("generated.m0904")}</TableHead>
            <TableHead>{translateMessage("generated.m0905")}</TableHead>
            <TableHead>{translateMessage("generated.m0906")}</TableHead>
            <TableHead>{translateMessage("generated.m0907")}</TableHead>
            <TableHead>{translateMessage("generated.m0908")}</TableHead>
            <TableHead>{translateMessage("generated.m0909")}</TableHead>
            <TableHead>{translateMessage("generated.m0882")}</TableHead>
            <TableHead>{translateMessage("generated.m0910")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isPending && <TableSkeleton columns={8} />}
          {query.isError && (
            <TableRow>
              <TableCell className="p-0" colSpan={8}>
                <ErrorEmptyState
                  onRetry={() => {
                    query.refetch()
                  }}
                />
              </TableCell>
            </TableRow>
          )}
          {!(query.isPending || query.isError) && operations.length === 0 && (
            <TableRow>
              <TableCell className="p-0" colSpan={8}>
                {startDate || endDate ? (
                  <FilterEmptyState />
                ) : (
                  <EmptyState
                    description={translateMessage("generated.m0186")}
                    title={translateMessage("generated.m0187")}
                  />
                )}
              </TableCell>
            </TableRow>
          )}
          {operations.map((op: InboundOperation) => (
            <TableRow key={op.id}>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    className="size-3.5 text-muted-foreground"
                    icon={Time01Icon}
                  />
                  <span className="text-xs">
                    {formatDateTime(op.operationTimestamp, dateFnsLocale)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium text-sm">{op.itemName}</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{op.itemCode}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{op.rackMarker}</Badge>
              </TableCell>
              <TableCell>
                <span className="font-mono text-muted-foreground text-xs">
                  [{op.positionX}, {op.positionY}]
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono font-semibold">{op.quantity}</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{op.assortmentCode}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    className="size-3.5 text-muted-foreground"
                    icon={UserIcon}
                  />
                  <span className="text-sm">{op.receivedByName}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PaginationFull
        currentPage={page}
        setPage={setPage}
        totalPages={totalPages}
        variant="compact"
      />
    </>
  )
}

function OutboundTableContent({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearDates,
  dateFnsLocale,
}: {
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onClearDates: () => void
  dateFnsLocale: DateFnsLocale
}) {
  const [page, setPage] = useState(1)

  const query = useAuditOutboundOperations({
    page: page - 1,
    size: PAGE_SIZE,
    sortBy: "operationTimestamp",
    sortDir: "desc",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const operations = query.data?.content ?? []
  const totalPages = query.data?.totalPages ?? 1
  const totalElements = query.data?.totalElements ?? 0

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        <DateRangeFilter
          endDate={endDate}
          onClear={onClearDates}
          onEndDateChange={onEndDateChange}
          onStartDateChange={onStartDateChange}
          startDate={startDate}
        />
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-primary text-sm tabular-nums">
            {totalElements}
          </span>
          <span className="text-muted-foreground text-xs">
            {translateMessage("generated.m0903", {
              value0: totalElements,
            })}
          </span>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>{translateMessage("generated.m0904")}</TableHead>
            <TableHead>{translateMessage("generated.m0905")}</TableHead>
            <TableHead>{translateMessage("generated.m0906")}</TableHead>
            <TableHead>{translateMessage("generated.m0907")}</TableHead>
            <TableHead>{translateMessage("generated.m0908")}</TableHead>
            <TableHead>{translateMessage("generated.m0909")}</TableHead>
            <TableHead>{translateMessage("generated.m0882")}</TableHead>
            <TableHead>{translateMessage("generated.m0911")}</TableHead>
            <TableHead>{translateMessage("generated.m0912")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isPending && <TableSkeleton columns={9} />}
          {query.isError && (
            <TableRow>
              <TableCell className="p-0" colSpan={9}>
                <ErrorEmptyState
                  onRetry={() => {
                    query.refetch()
                  }}
                />
              </TableCell>
            </TableRow>
          )}
          {!(query.isPending || query.isError) && operations.length === 0 && (
            <TableRow>
              <TableCell className="p-0" colSpan={9}>
                {startDate || endDate ? (
                  <FilterEmptyState />
                ) : (
                  <EmptyState
                    description={translateMessage("generated.m0186")}
                    title={translateMessage("generated.m0188")}
                  />
                )}
              </TableCell>
            </TableRow>
          )}
          {operations.map((op: OutboundOperation) => (
            <TableRow key={op.id}>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    className="size-3.5 text-muted-foreground"
                    icon={Time01Icon}
                  />
                  <span className="text-xs">
                    {formatDateTime(op.operationTimestamp, dateFnsLocale)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium text-sm">{op.itemName}</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{op.itemCode}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{op.rackMarker}</Badge>
              </TableCell>
              <TableCell>
                <span className="font-mono text-muted-foreground text-xs">
                  [{op.positionX}, {op.positionY}]
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono font-semibold">{op.quantity}</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{op.assortmentCode}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    className="size-3.5 text-muted-foreground"
                    icon={UserIcon}
                  />
                  <span className="text-sm">{op.issuedByName}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={op.fifoCompliant ? "success" : "warning"}>
                  {op.fifoCompliant
                    ? translateMessage("generated.m1129")
                    : translateMessage("generated.m1130")}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PaginationFull
        currentPage={page}
        setPage={setPage}
        totalPages={totalPages}
        variant="compact"
      />
    </>
  )
}

export default function AuditMain() {
  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)

  const [inboundStartDate, setInboundStartDate] = useState("")
  const [inboundEndDate, setInboundEndDate] = useState("")
  const [outboundStartDate, setOutboundStartDate] = useState("")
  const [outboundEndDate, setOutboundEndDate] = useState("")

  const handleClearInboundDates = () => {
    setInboundStartDate("")
    setInboundEndDate("")
  }

  const handleClearOutboundDates = () => {
    setOutboundStartDate("")
    setOutboundEndDate("")
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description={translateMessage("generated.m0189")}
        icon={Analytics01Icon}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title={translateMessage("generated.m0190")}
      />

      <Tabs defaultValue="inbound">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4">
            <TabsList className="h-auto" variant="line">
              <TabsTrigger className="py-2.5" value="inbound">
                <HugeiconsIcon className="size-3.5" icon={PackageReceiveIcon} />
                {translateMessage("generated.m0913")}
              </TabsTrigger>
              <TabsTrigger className="py-2.5" value="outbound">
                <HugeiconsIcon className="size-3.5" icon={PackageIcon} />
                {translateMessage("generated.m0914")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inbound">
            <InboundTableContent
              dateFnsLocale={dateFnsLocale}
              endDate={inboundEndDate}
              onClearDates={handleClearInboundDates}
              onEndDateChange={(v) => {
                setInboundEndDate(v)
              }}
              onStartDateChange={(v) => {
                setInboundStartDate(v)
              }}
              startDate={inboundStartDate}
            />
          </TabsContent>

          <TabsContent value="outbound">
            <OutboundTableContent
              dateFnsLocale={dateFnsLocale}
              endDate={outboundEndDate}
              onClearDates={handleClearOutboundDates}
              onEndDateChange={(v) => {
                setOutboundEndDate(v)
              }}
              onStartDateChange={(v) => {
                setOutboundStartDate(v)
              }}
              startDate={outboundStartDate}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
