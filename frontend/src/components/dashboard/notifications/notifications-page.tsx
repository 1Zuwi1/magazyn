"use client"

import {
  Alert01Icon,
  ArrowRight02Icon,
  CheckmarkBadge01Icon,
  FilterIcon,
  InboxIcon,
  Notification01Icon,
  Time01Icon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { format, formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import type { UserNotification } from "@/hooks/use-notifications"
import useNotifications, {
  useMarkBulkNotifications,
  useMarkNotification,
} from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

type FeedFilter = "ALL" | "UNREAD"

const ALERT_TYPE_OPTIONS = [
  { value: "WEIGHT_EXCEEDED", label: "Przekroczenie wagi" },
  { value: "TEMPERATURE_TOO_HIGH", label: "Temp. za wysoka" },
  { value: "TEMPERATURE_TOO_LOW", label: "Temp. za niska" },
  { value: "LOW_VISUAL_SIMILARITY", label: "Niska zgodność wizualna" },
  { value: "ITEM_TEMPERATURE_TOO_HIGH", label: "Temp. produktu za wysoka" },
  { value: "ITEM_TEMPERATURE_TOO_LOW", label: "Temp. produktu za niska" },
  {
    value: "EMBEDDING_GENERATION_COMPLETED",
    label: "Generowanie embeddingów ukończone",
  },
  {
    value: "EMBEDDING_GENERATION_FAILED",
    label: "Generowanie embeddingów nieudane",
  },
  { value: "ASSORTMENT_EXPIRED", label: "Asortyment przeterminowany" },
  { value: "ASSORTMENT_CLOSE_TO_EXPIRY", label: "Asortyment bliski terminu" },
] as const

const toTitleCase = (value: string): string =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`)
    .join(" ")

const getNotificationTitle = (notification: UserNotification): string =>
  notification.alert.alertTypeDescription?.trim() ||
  toTitleCase(notification.alert.alertType)

function getNotificationIcon(alertType: string): IconSvgElement {
  switch (alertType) {
    case "WEIGHT_EXCEEDED":
    case "RACK_OVERWEIGHT":
      return WeightScale01Icon
    default:
      return Alert01Icon
  }
}

function getStatusConfig(status: string): {
  badgeVariant: "default" | "destructive" | "secondary"
  cardClassName: string
  label: string
} {
  const normalizedStatus = status.toUpperCase()

  if (normalizedStatus === "OPEN" || normalizedStatus.includes("CRITICAL")) {
    return {
      badgeVariant: "destructive",
      cardClassName: "bg-destructive/10 text-destructive",
      label: "Otwarte",
    }
  }

  if (normalizedStatus === "RESOLVED" || normalizedStatus === "CLOSED") {
    return {
      badgeVariant: "secondary",
      cardClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      label: "Rozwiązane",
    }
  }

  return {
    badgeVariant: "default",
    cardClassName: "bg-muted text-muted-foreground",
    label: toTitleCase(status),
  }
}

const formatDateTime = (date: Date | null | undefined): string => {
  if (!date) {
    return "—"
  }

  return format(date, "dd MMMM yyyy, HH:mm", { locale: pl })
}

const formatMetricValue = (value: number | null | undefined): string =>
  value == null ? "—" : value.toString()

const getLocationHref = (notification: UserNotification): string | null => {
  const warehouseName = notification.alert.warehouseName

  if (!warehouseName) {
    return null
  }

  return `/dashboard/warehouse/${encodeURIComponent(warehouseName)}`
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

function NotificationListBody({
  isPending,
  isError,
  notifications,
  onSelect,
  selectedNotificationId,
}: {
  isPending: boolean
  isError: boolean
  notifications: UserNotification[]
  onSelect: (notification: UserNotification) => void
  selectedNotificationId: number | null
}) {
  if (isPending) {
    return (
      <>
        {Array.from({ length: 5 }, (_, index) => (
          <div
            className="h-20 animate-pulse rounded-lg border bg-muted/40"
            key={`notification-list-skeleton-${index}`}
          />
        ))}
      </>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="font-medium">Nie udało się pobrać powiadomień</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Spróbuj ponownie za chwilę.
        </p>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-6 text-muted-foreground"
            icon={InboxIcon}
          />
        </div>
        <p className="mt-3 font-medium">Brak powiadomień</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Brak wpisów dla wybranego filtra
        </p>
      </div>
    )
  }

  return (
    <>
      {notifications.map((notification) => {
        const statusConfig = getStatusConfig(notification.alert.status)
        const isSelected = selectedNotificationId === notification.id

        return (
          <button
            className={cn(
              "flex w-full gap-3 rounded-lg border p-3 text-left transition-all",
              isSelected
                ? "border-primary bg-primary/5"
                : "hover:border-primary/30 hover:bg-muted/50",
              !notification.read && "bg-muted/30"
            )}
            key={notification.id}
            onClick={() => onSelect(notification)}
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
                icon={getNotificationIcon(notification.alert.alertType)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-sm">
                  {getNotificationTitle(notification)}
                </p>
                {!notification.read && (
                  <span className="flex size-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                {notification.alert.message}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatDistanceToNow(notification.createdAt, {
                  addSuffix: true,
                  locale: pl,
                })}
              </p>
            </div>
          </button>
        )
      })}
    </>
  )
}

function NotificationDetailsPanel({
  notification,
  onToggleReadStatus,
}: {
  notification: UserNotification | null
  onToggleReadStatus: () => void
}) {
  if (!notification) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-8 text-muted-foreground"
            icon={Notification01Icon}
          />
        </div>
        <p className="mt-4 font-medium text-lg">Wybierz powiadomienie</p>
        <p className="mt-1 text-center text-muted-foreground text-sm">
          Kliknij wpis na liście, aby zobaczyć szczegóły
        </p>
      </div>
    )
  }

  const statusConfig = getStatusConfig(notification.alert.status)
  const differenceValue =
    notification.alert.actualValue != null &&
    notification.alert.thresholdValue != null
      ? notification.alert.actualValue - notification.alert.thresholdValue
      : null
  const locationHref = getLocationHref(notification)
  const hasResolutionData = Boolean(
    notification.alert.resolvedByName || notification.alert.resolutionNotes
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/20 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusConfig.badgeVariant}>
            {statusConfig.label}
          </Badge>
          <Badge variant="outline">
            {toTitleCase(notification.alert.alertType)}
          </Badge>
          {!notification.read && (
            <Badge variant="secondary">Nieprzeczytane</Badge>
          )}
        </div>
        <h2 className="mt-3 font-semibold text-xl">
          {getNotificationTitle(notification)}
        </h2>
        <p className="mt-1 text-muted-foreground">
          {notification.alert.message}
        </p>
      </div>

      <div className="flex-1 space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">
            Lokalizacja
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailsCard
              label="Magazyn"
              value={
                notification.alert.warehouseName ??
                notification.alert.warehouseId ??
                "—"
              }
            />
            <DetailsCard
              label="Regał"
              value={
                notification.alert.rackMarker ??
                notification.alert.rackId ??
                "—"
              }
            />
            <DetailsCard
              label="Status"
              value={toTitleCase(notification.alert.status)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">Metryki</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailsCard
              label="Próg"
              value={formatMetricValue(notification.alert.thresholdValue)}
            />
            <DetailsCard
              label="Wartość"
              value={formatMetricValue(notification.alert.actualValue)}
            />
            <DetailsCard
              label="Różnica"
              value={differenceValue == null ? "—" : differenceValue.toString()}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">Czas</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailsCard
              label="Utworzono"
              value={formatDateTime(notification.createdAt)}
            />
            <DetailsCard
              label="Odczytano"
              value={formatDateTime(notification.readAt)}
            />
            <DetailsCard
              label="Aktualizacja alertu"
              value={formatDateTime(notification.alert.updatedAt)}
            />
            <DetailsCard
              label="Rozwiązanie alertu"
              value={formatDateTime(notification.alert.resolvedAt)}
            />
          </div>
        </section>

        {hasResolutionData ? (
          <section className="space-y-3">
            <h3 className="font-medium text-muted-foreground text-sm">
              Notatka rozwiązania
            </h3>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-muted-foreground text-xs">Rozwiązane przez</p>
              <p className="mt-0.5 font-medium">
                {notification.alert.resolvedByName ?? "—"}
              </p>
              {notification.alert.resolutionNotes ? (
                <p className="mt-2 text-sm">
                  {notification.alert.resolutionNotes}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 p-4">
        <Button
          onClick={onToggleReadStatus}
          variant={notification.read ? "outline" : "default"}
        >
          {notification.read
            ? "Oznacz jako nieprzeczytane"
            : "Oznacz jako przeczytane"}
        </Button>
        {locationHref ? (
          <Link
            className={buttonVariants({
              variant: "outline",
              size: "sm",
            })}
            href={locationHref}
          >
            Przejdź do lokalizacji
            <HugeiconsIcon className="ml-2 size-4" icon={ArrowRight02Icon} />
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function AlertTypeFilterDropdown({
  selected,
  onToggle,
  onClear,
}: {
  selected: string[]
  onToggle: (alertType: string) => void
  onClear: () => void
}) {
  return (
    <div className="flex items-center justify-between border-b p-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-colors hover:bg-muted",
            selected.length > 0 && "text-primary"
          )}
        >
          <HugeiconsIcon className="size-4" icon={FilterIcon} />
          Typ alertu
          {selected.length > 0 && (
            <Badge className="ml-1" variant="secondary">
              {selected.length}
            </Badge>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64" side="bottom">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Filtruj po typie alertu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALERT_TYPE_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                checked={selected.includes(option.value)}
                key={option.value}
                onClick={() => onToggle(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
            {selected.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <button
                  className="w-full rounded-sm px-2 py-1.5 text-center text-muted-foreground text-sm hover:bg-muted"
                  onClick={onClear}
                  type="button"
                >
                  Wyczyść filtry
                </button>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function NotificationsMain() {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("ALL")
  const [alertTypeFilter, setAlertTypeFilter] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | null
  >(null)

  const allNotificationsQuery = useNotifications({
    page: page - 1,
    sortBy: "createdAt",
    sortDir: "desc",
    alertType: alertTypeFilter.length > 0 ? alertTypeFilter : undefined,
  })

  const markBulkNotifications = useMarkBulkNotifications()
  const markNotification = useMarkNotification()

  const notificationsData = allNotificationsQuery.data
  const allNotifications = notificationsData?.content ?? []
  const isNotificationsPending = allNotificationsQuery.isPending
  const isNotificationsError = allNotificationsQuery.isError

  const notifications =
    feedFilter === "UNREAD"
      ? allNotifications.filter((notification) => !notification.read)
      : allNotifications

  const totalNotifications = allNotificationsQuery.data?.totalElements ?? 0
  const unreadCount = allNotifications.filter(
    (notification) => !notification.read
  ).length

  useEffect(() => {
    setSelectedNotificationId((currentSelection) => {
      if (notifications.length === 0) {
        return null
      }

      if (
        currentSelection != null &&
        notifications.some(
          (notification) => notification.id === currentSelection
        )
      ) {
        return currentSelection
      }

      return notifications[0]?.id ?? null
    })
  }, [notifications])

  const selectedNotification = useMemo(
    () =>
      notifications.find(
        (notification) => notification.id === selectedNotificationId
      ) ?? null,
    [notifications, selectedNotificationId]
  )

  const totalPages = notificationsData?.totalPages ?? 1

  const handleSelectNotification = (notification: UserNotification) => {
    setSelectedNotificationId(notification.id)
    if (!notification.read) {
      markNotification.mutate({
        notificationId: notification.id.toString(),
        read: true,
      })
    }
  }

  const handleToggleReadStatus = () => {
    if (!selectedNotification) {
      return
    }

    markNotification.mutate({
      notificationId: selectedNotification.id.toString(),
      read: !selectedNotification.read,
    })
  }

  const handleMarkAllAsRead = () => {
    markBulkNotifications.mutate({
      read: true,
    })
  }

  const handleFeedFilterChange = (nextFilter: FeedFilter) => {
    setFeedFilter(nextFilter)
    setPage(1)
  }

  const handleToggleAlertType = (alertType: string) => {
    setAlertTypeFilter((previous) => {
      const next = previous.includes(alertType)
        ? previous.filter((t) => t !== alertType)
        : [...previous, alertType]
      return next
    })
    setPage(1)
  }

  const handleClearAlertTypeFilter = () => {
    setAlertTypeFilter([])
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-card via-card to-primary/2">
        <div className="mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-30" />
        <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-linear-to-br from-primary/10 to-transparent blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative flex size-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 sm:size-16">
                <HugeiconsIcon
                  className="size-7 text-primary sm:size-8"
                  icon={Notification01Icon}
                />
                {unreadCount > 0 && (
                  <div className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary font-bold text-[10px] text-primary-foreground">
                    {unreadCount}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
                  Powiadomienia
                </h1>
                <p className="max-w-md text-muted-foreground text-sm">
                  Przeglądaj i zarządzaj swoimi powiadomieniami
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
                    <span className="font-mono font-semibold text-primary">
                      {totalNotifications}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      łącznie
                    </span>
                  </div>
                  {unreadCount > 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-1.5">
                      <span className="flex size-2 rounded-full bg-orange-500" />
                      <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                        {unreadCount}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        nieprzeczytanych
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={unreadCount === 0 || markBulkNotifications.isPending}
                onClick={handleMarkAllAsRead}
                variant="outline"
              >
                <HugeiconsIcon
                  className="mr-2 size-4"
                  icon={CheckmarkBadge01Icon}
                />
                Oznacz wszystkie jako przeczytane
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b bg-muted/30 p-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={cn(
                    "rounded-md px-3 py-2 font-medium text-sm transition-colors",
                    feedFilter === "ALL"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleFeedFilterChange("ALL")}
                  type="button"
                >
                  Wszystkie
                </button>
                <button
                  className={cn(
                    "rounded-md px-3 py-2 font-medium text-sm transition-colors",
                    feedFilter === "UNREAD"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleFeedFilterChange("UNREAD")}
                  type="button"
                >
                  Nieprzeczytane
                </button>
              </div>
            </div>

            <AlertTypeFilterDropdown
              onClear={handleClearAlertTypeFilter}
              onToggle={handleToggleAlertType}
              selected={alertTypeFilter}
            />

            <ScrollArea className="h-112">
              <div className="space-y-2 p-2">
                <NotificationListBody
                  isError={isNotificationsError}
                  isPending={isNotificationsPending}
                  notifications={notifications}
                  onSelect={handleSelectNotification}
                  selectedNotificationId={selectedNotificationId}
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
          <NotificationDetailsPanel
            notification={selectedNotification}
            onToggleReadStatus={handleToggleReadStatus}
          />
        </div>
      </div>

      {selectedNotification ? (
        <div className="rounded-lg border border-dashed p-3 text-muted-foreground text-xs">
          <HugeiconsIcon className="mr-1 inline size-3.5" icon={Time01Icon} />
          Ostatnia aktualizacja:{" "}
          {formatDateTime(selectedNotification.alert.updatedAt)}
        </div>
      ) : null}
    </div>
  )
}
