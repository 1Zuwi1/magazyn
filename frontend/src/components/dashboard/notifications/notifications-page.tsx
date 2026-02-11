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
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import PaginationFull from "@/components/ui/pagination-component"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { UserNotification } from "@/hooks/use-notifications"
import useNotifications, {
  useMarkBulkNotifications,
  useMarkNotification,
} from "@/hooks/use-notifications"
import { getDateFnsLocale } from "@/i18n/date-fns-locale"
import { findAlertTitle } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { formatDateTime, toTitleCase } from "../utils/helpers"

type FeedFilter = "ALL" | "UNREAD"

function getNotificationIcon(alertType: string): IconSvgElement {
  switch (alertType) {
    case "WEIGHT_EXCEEDED":
    case "RACK_OVERWEIGHT":
      return WeightScale01Icon
    default:
      return Alert01Icon
  }
}

function getStatusConfig(
  t: ReturnType<typeof useTranslations>,
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

  return {
    badgeVariant: "default",
    cardClassName: "bg-muted text-muted-foreground",
    label: toTitleCase(status),
  }
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
  const t = useTranslations()
  const locale = useLocale()

  if (isPending) {
    return (
      <>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton
            className="h-20 rounded-lg"
            key={`notification-list-skeleton-${index}`}
          />
        ))}
      </>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="font-medium">
          {t("generated.dashboard.notifications.failedDownloadNotifications")}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("generated.shared.againMoment")}
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
        <p className="mt-3 font-medium">
          {t("generated.dashboard.notifications.notifications")}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("generated.shared.entriesSelectedFilter")}
        </p>
      </div>
    )
  }

  return (
    <>
      {notifications.map((notification) => {
        const statusConfig = getStatusConfig(t, notification.alert.status)
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
                  {findAlertTitle(notification.alert, t)}
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
                  locale: getDateFnsLocale(locale),
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
  const t = useTranslations()
  const locale = useLocale()

  if (!notification) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-8 text-muted-foreground"
            icon={Notification01Icon}
          />
        </div>
        <p className="mt-4 font-medium text-lg">
          {t("generated.dashboard.notifications.selectNotification")}
        </p>
        <p className="mt-1 text-center text-muted-foreground text-sm">
          {t("generated.shared.clickEntryListSeeDetails")}
        </p>
      </div>
    )
  }

  const statusConfig = getStatusConfig(t, notification.alert.status)
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
          {!notification.read && (
            <Badge variant="secondary">
              {t("generated.dashboard.notifications.unread")}
            </Badge>
          )}
        </div>
        <h2 className="mt-3 font-semibold text-xl">
          {findAlertTitle(notification.alert, t)}
        </h2>
        <p className="mt-1 text-muted-foreground">
          {notification.alert.message}
        </p>
      </div>

      <div className="flex-1 space-y-6 p-6">
        <section className="space-y-3">
          <h3 className="font-medium text-muted-foreground text-sm">
            {t("generated.shared.location")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailsCard
              label={t("generated.shared.warehouse")}
              value={
                notification.alert.warehouseName ??
                notification.alert.warehouseId ??
                "—"
              }
            />
            <DetailsCard
              label={t("generated.shared.rack")}
              value={
                notification.alert.rackMarker ??
                notification.alert.rackId ??
                "—"
              }
            />
            <DetailsCard
              label={t("generated.shared.status")}
              value={getStatusConfig(t, notification.alert.status).label}
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
              value={formatMetricValue(notification.alert.thresholdValue)}
            />
            <DetailsCard
              label={t("generated.shared.value")}
              value={formatMetricValue(notification.alert.actualValue)}
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
              value={formatDateTime(notification.createdAt, locale)}
            />
            <DetailsCard
              label={t("generated.dashboard.notifications.read")}
              value={formatDateTime(notification.readAt, locale)}
            />
            <DetailsCard
              label={t("generated.dashboard.notifications.alertUpdate")}
              value={formatDateTime(notification.alert.updatedAt, locale)}
            />
            <DetailsCard
              label={t("generated.dashboard.notifications.resolvingAlert")}
              value={formatDateTime(notification.alert.resolvedAt, locale)}
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
            ? t("generated.dashboard.notifications.markUnread")
            : t("generated.dashboard.notifications.markRead")}
        </Button>
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
      </div>
    </div>
  )
}

export default function NotificationsMain() {
  const t = useTranslations()

  const locale = useLocale()

  const [feedFilter, setFeedFilter] = useState<FeedFilter>("ALL")
  const [page, setPage] = useState(1)
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | null
  >(null)

  const notificationsQuery = useNotifications({
    page: page - 1,
    sortBy: "createdAt",
    sortDir: "desc",
    read: feedFilter === "UNREAD" ? false : undefined,
  })
  const { data: totalNotificationsData, refetch: refetchTotalNotifications } =
    useNotifications({
      page: 0,
      size: 1,
    })
  const { data: unreadNotificationsData, refetch: refetchUnreadNotifications } =
    useNotifications({
      page: 0,
      size: 1,
      read: false,
    })

  const markBulkNotifications = useMarkBulkNotifications()
  const markNotification = useMarkNotification()

  const notificationsData = notificationsQuery.data
  const notifications = notificationsData?.content ?? []
  const isNotificationsPending = notificationsQuery.isPending
  const isNotificationsError = notificationsQuery.isError
  const totalNotifications = totalNotificationsData?.totalElements ?? 0
  const unreadCount = unreadNotificationsData?.totalElements ?? 0
  const totalPages = notificationsData?.totalPages ?? 1

  const refreshNotificationQueries = () => {
    notificationsQuery.refetch()
    refetchTotalNotifications()
    refetchUnreadNotifications()
  }

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

  const handleSelectNotification = (notification: UserNotification) => {
    setSelectedNotificationId(notification.id)
    if (!notification.read) {
      markNotification.mutate(
        {
          notificationId: notification.id.toString(),
          read: true,
        },
        {
          onSuccess: () => {
            refreshNotificationQueries()
          },
        }
      )
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
                  {t("generated.shared.notifications")}
                </h1>
                <p className="max-w-md text-muted-foreground text-sm">
                  {t(
                    "generated.dashboard.notifications.viewManageNotifications"
                  )}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
                    <span className="font-mono font-semibold text-primary">
                      {totalNotifications}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("generated.shared.together")}
                    </span>
                  </div>
                  {unreadCount > 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-1.5">
                      <span className="flex size-2 rounded-full bg-orange-500" />
                      <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                        {unreadCount}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {t("generated.dashboard.notifications.unread2")}
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
                {t("generated.dashboard.notifications.markAllRead")}
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
                  {t("generated.shared.all")}
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
                  {t("generated.dashboard.notifications.unread")}
                </button>
              </div>
            </div>

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
          {t("generated.shared.lastUpdated", {
            value0: formatDateTime(
              selectedNotification.alert.updatedAt,
              locale
            ),
          })}
        </div>
      ) : null}
    </div>
  )
}
