"use client"

import {
  Alert01Icon,
  ArrowRight02Icon,
  CheckmarkBadge01Icon,
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
import { ScrollArea } from "@/components/ui/scroll-area"
import useNotifications, {
  type UserNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useMarkNotificationAsUnread,
  useUnreadNotifications,
  useUnreadNotificationsCount,
} from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"

const NOTIFICATIONS_PAGE_SIZE = 20

type FeedFilter = "ALL" | "UNREAD"

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
  const warehouseId = notification.alert.warehouseId
  const warehouseName = notification.alert.warehouseName

  if (warehouseId == null || !warehouseName) {
    return null
  }

  return `/admin/warehouses/id/${warehouseId}/${encodeURIComponent(warehouseName)}`
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

export default function NotificationsMain() {
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("ALL")
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | null
  >(null)

  const allNotificationsQuery = useNotifications({
    page,
    size: NOTIFICATIONS_PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  })
  const unreadNotificationsQuery = useUnreadNotifications({
    page,
    size: NOTIFICATIONS_PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  })
  const { data: unreadNotificationsCount } = useUnreadNotificationsCount()

  const markAllAsReadMutation = useMarkAllNotificationsAsRead()
  const markNotificationAsRead = useMarkNotificationAsRead()
  const markNotificationAsUnread = useMarkNotificationAsUnread()

  const activeQuery =
    feedFilter === "UNREAD" ? unreadNotificationsQuery : allNotificationsQuery
  const notificationsData = activeQuery.data
  const notifications = notificationsData?.content ?? []
  const isNotificationsPending = activeQuery.isPending
  const isNotificationsError = activeQuery.isError

  const totalNotifications = allNotificationsQuery.data?.totalElements ?? 0
  const fallbackUnreadCount = notifications.filter(
    (notification) => !notification.read
  ).length
  const unreadCount = unreadNotificationsCount ?? fallbackUnreadCount

  const availableAlertTypes = useMemo(
    () => [
      ...new Set(
        notifications.map((notification) => notification.alert.alertType)
      ),
    ],
    [notifications]
  )

  const filteredNotifications = useMemo(() => {
    if (!typeFilter) {
      return notifications
    }

    return notifications.filter(
      (notification) => notification.alert.alertType === typeFilter
    )
  }, [notifications, typeFilter])

  useEffect(() => {
    setTypeFilter((previousTypeFilter) => {
      if (!previousTypeFilter) {
        return previousTypeFilter
      }

      return availableAlertTypes.includes(previousTypeFilter)
        ? previousTypeFilter
        : null
    })
  }, [availableAlertTypes])

  useEffect(() => {
    setSelectedNotificationId((currentSelection) => {
      if (filteredNotifications.length === 0) {
        return null
      }

      if (
        currentSelection != null &&
        filteredNotifications.some(
          (notification) => notification.id === currentSelection
        )
      ) {
        return currentSelection
      }

      return filteredNotifications[0]?.id ?? null
    })
  }, [filteredNotifications])

  const selectedNotification = useMemo(
    () =>
      filteredNotifications.find(
        (notification) => notification.id === selectedNotificationId
      ) ?? null,
    [filteredNotifications, selectedNotificationId]
  )

  const currentPage = (notificationsData?.page ?? page) + 1
  const totalPages = notificationsData?.totalPages ?? 1

  const handleSelectNotification = (notification: UserNotification) => {
    setSelectedNotificationId(notification.id)
    if (!notification.read) {
      markNotificationAsRead.mutate(notification.id)
    }
  }

  const handleToggleReadStatus = () => {
    if (!selectedNotification) {
      return
    }

    if (selectedNotification.read) {
      markNotificationAsUnread.mutate(selectedNotification.id)
      return
    }

    markNotificationAsRead.mutate(selectedNotification.id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  const handleFeedFilterChange = (nextFilter: FeedFilter) => {
    setFeedFilter(nextFilter)
    setPage(0)
  }

  const handleTypeFilterChange = (nextTypeFilter: string | null) => {
    setTypeFilter(nextTypeFilter)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <Button
            disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
            onClick={handleMarkAllAsRead}
            variant="outline"
          >
            <HugeiconsIcon
              className="mr-2 size-4"
              icon={CheckmarkBadge01Icon}
            />
            Oznacz wszystkie jako przeczytane
          </Button>
        }
        description="Przeglądaj i zarządzaj alertami systemowymi"
        icon={Notification01Icon}
        iconBadge={unreadCount > 0 ? unreadCount : undefined}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Powiadomienia"
      >
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="font-mono font-semibold text-primary">
              {totalNotifications}
            </span>
            <span className="text-muted-foreground text-xs">łącznie</span>
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
      </AdminPageHeader>

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

            <div className="space-y-1 border-b p-2">
              <button
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors",
                  typeFilter === null
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
                onClick={() => handleTypeFilterChange(null)}
                type="button"
              >
                <span className="font-medium text-sm">Wszystkie typy</span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-muted-foreground text-xs">
                  {notifications.length}
                </span>
              </button>
              {availableAlertTypes.map((alertType) => {
                const typeCount = notifications.filter(
                  (notification) => notification.alert.alertType === alertType
                ).length
                const isTypeActive = typeFilter === alertType

                return (
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors",
                      isTypeActive
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                    key={alertType}
                    onClick={() => handleTypeFilterChange(alertType)}
                    type="button"
                  >
                    <span className="font-medium text-sm">
                      {toTitleCase(alertType)}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-muted-foreground text-xs">
                      {typeCount}
                    </span>
                  </button>
                )
              })}
            </div>

            <ScrollArea className="h-112">
              <div className="space-y-2 p-2">
                <NotificationListBody
                  isError={isNotificationsError}
                  isPending={isNotificationsPending}
                  notifications={filteredNotifications}
                  onSelect={handleSelectNotification}
                  selectedNotificationId={selectedNotificationId}
                />
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
              <p className="text-muted-foreground text-xs">
                Strona {currentPage} z {Math.max(totalPages, 1)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-colors",
                    page === 0 || isNotificationsPending
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-muted"
                  )}
                  disabled={page === 0 || isNotificationsPending}
                  onClick={() => setPage((previousPage) => previousPage - 1)}
                  type="button"
                >
                  Poprzednia
                </button>
                <button
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-colors",
                    page + 1 >= totalPages || isNotificationsPending
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-muted"
                  )}
                  disabled={page + 1 >= totalPages || isNotificationsPending}
                  onClick={() => setPage((previousPage) => previousPage + 1)}
                  type="button"
                >
                  Następna
                </button>
              </div>
            </div>
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
