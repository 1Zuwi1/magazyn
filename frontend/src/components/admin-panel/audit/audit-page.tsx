"use client"

import {
  Analytics01Icon,
  Calendar03Icon,
  InboxIcon,
  PackageIcon,
  PackageReceiveIcon,
  Time01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { ErrorEmptyState, FilterEmptyState } from "@/components/ui/empty-state"
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

const PAGE_SIZE = 20

const formatDateTime = (date: string): string => {
  try {
    return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: pl })
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
    <div className="flex flex-wrap items-center gap-2">
      <HugeiconsIcon
        className="size-4 text-muted-foreground"
        icon={Calendar03Icon}
      />
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
      {hasFilter && (
        <Button onClick={onClear} size="xs" variant="ghost">
          Wyczysc
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <HugeiconsIcon
          className="size-6 text-muted-foreground"
          icon={InboxIcon}
        />
      </div>
      <p className="mt-3 font-medium">{message}</p>
      <p className="mt-1 text-muted-foreground text-sm">
        Zmien filtry lub zakres dat, aby zobaczyc wyniki
      </p>
    </div>
  )
}

function InboundOperationsTab() {
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

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

  const handleClearDates = () => {
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  const handleStartDateChange = (value: string) => {
    setStartDate(value)
    setPage(1)
  }

  const handleEndDateChange = (value: string) => {
    setEndDate(value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter
          endDate={endDate}
          onClear={handleClearDates}
          onEndDateChange={handleEndDateChange}
          onStartDateChange={handleStartDateChange}
          startDate={startDate}
        />
        <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
          <span className="font-mono font-semibold text-primary">
            {totalElements}
          </span>
          <span className="text-muted-foreground text-xs">operacji</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Data</TableHead>
              <TableHead>Przedmiot</TableHead>
              <TableHead>Kod</TableHead>
              <TableHead>Regal</TableHead>
              <TableHead>Pozycja</TableHead>
              <TableHead>Ilosc</TableHead>
              <TableHead>Asortyment</TableHead>
              <TableHead>Przyjal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending && <TableSkeleton columns={8} />}
            {query.isError && (
              <TableRow>
                <TableCell className="p-0!" colSpan={8}>
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
                <TableCell className="p-0!" colSpan={8}>
                  <FilterEmptyState onClear={handleClearDates} />
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
                      {formatDateTime(op.operationTimestamp)}
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
      </div>
    </div>
  )
}

function OutboundOperationsTab() {
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

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

  const handleClearDates = () => {
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  const handleStartDateChange = (value: string) => {
    setStartDate(value)
    setPage(1)
  }

  const handleEndDateChange = (value: string) => {
    setEndDate(value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter
          endDate={endDate}
          onClear={handleClearDates}
          onEndDateChange={handleEndDateChange}
          onStartDateChange={handleStartDateChange}
          startDate={startDate}
        />
        <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
          <span className="font-mono font-semibold text-primary">
            {totalElements}
          </span>
          <span className="text-muted-foreground text-xs">operacji</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Data</TableHead>
              <TableHead>Przedmiot</TableHead>
              <TableHead>Kod</TableHead>
              <TableHead>Regal</TableHead>
              <TableHead>Pozycja</TableHead>
              <TableHead>Ilosc</TableHead>
              <TableHead>Asortyment</TableHead>
              <TableHead>Wydal</TableHead>
              <TableHead>FIFO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isPending && <TableSkeleton columns={9} />}
            {query.isError && (
              <TableRow>
                <TableCell className="p-0!" colSpan={9}>
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
                <TableCell className="p-0!" colSpan={9}>
                  <EmptyState message="Brak operacji wydania" />
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
                      {formatDateTime(op.operationTimestamp)}
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
                    {op.fifoCompliant ? "Tak" : "Nie"}
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
      </div>
    </div>
  )
}

export default function AuditMain() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Historia operacji magazynowych - przyjecia i wydania"
        icon={Analytics01Icon}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Audyt operacji"
      />

      <Tabs defaultValue="inbound">
        <TabsList>
          <TabsTrigger value="inbound">
            <HugeiconsIcon className="size-3.5" icon={PackageReceiveIcon} />
            Przyjecia
          </TabsTrigger>
          <TabsTrigger value="outbound">
            <HugeiconsIcon className="size-3.5" icon={PackageIcon} />
            Wydania
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbound">
          <InboundOperationsTab />
        </TabsContent>

        <TabsContent value="outbound">
          <OutboundOperationsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
