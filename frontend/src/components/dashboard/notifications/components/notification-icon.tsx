"use client"

import {
  Alert01Icon,
  ArrowRight02Icon,
  InboxIcon,
  Notification01Icon,
  TickDouble02Icon,
  Time01Icon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { formatDistanceToNow } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { type ReactNode, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { ErrorEmptyState } from "@/components/ui/empty-state"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import useNotifications, {
  type UserNotification,
  useMarkBulkNotifications,
  useMarkNotification,
} from "@/hooks/use-notifications"
import { getDateFnsLocale } from "@/i18n/date-fns-locale"
import { findAlertTitle } from "@/lib/schemas"
import { cn } from "@/lib/utils"

function getNotificationIcon(alertType: string): IconSvgElement {
  switch (alertType) {
    case "WEIGHT_EXCEEDED":
    case "RACK_OVERWEIGHT":
      return WeightScale01Icon
    case "ITEM_EXPIRED":
      return Time01Icon
    default:
      return Alert01Icon
  }
}

function getStatusConfig(status: string) {
  const normalizedStatus = status.toUpperCase()

  if (normalizedStatus === "OPEN" || normalizedStatus.includes("CRITICAL")) {
    return {
      bg: "bg-destructive/10",
      text: "text-destructive",
    }
  }

  if (normalizedStatus === "RESOLVED" || normalizedStatus === "CLOSED") {
    return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
    }
  }

  return {
    bg: "bg-muted",
    text: "text-muted-foreground",
  }
}

export function NotificationInbox() {
  const t = useTranslations()

  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)

  const [open, setOpen] = useState(false)
  const {
    data: notificationsData,
    isPending: isNotificationsPending,
    isError: isNotificationsError,
    refetch: refetchNotifications,
  } = useNotifications(
    {
      page: 0,
      sortBy: "createdAt",
      sortDir: "desc",
    },
    {
      enabled: open,
    }
  )

  const { data: unreadNotificationsData } = useNotifications({
    read: false,
    size: 1,
  })

  const markBulkNotifications = useMarkBulkNotifications()
  const markNotification = useMarkNotification()

  const notifications = notificationsData?.content ?? []
  const unreadCount = unreadNotificationsData?.totalElements ?? 0

  const handleMarkAllRead = () => {
    markBulkNotifications.mutate({
      read: true,
    })
  }

  const handleMarkAsRead = (notification: UserNotification) => {
    if (notification.read) {
      return
    }
    markNotification.mutate({
      notificationId: notification.id.toString(),
      read: true,
    })
  }

  let notificationsListContent: ReactNode

  if (isNotificationsPending) {
    notificationsListContent = (
      <div className="space-y-2 p-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            className="h-16 rounded-lg"
            key={`notification-skeleton-${index}`}
          />
        ))}
      </div>
    )
  } else if (isNotificationsError) {
    notificationsListContent = (
      <ErrorEmptyState onRetry={refetchNotifications} />
    )
  } else if (notifications.length === 0) {
    notificationsListContent = (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12"
        initial={{ opacity: 0, y: 10 }}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-7 text-muted-foreground"
            icon={InboxIcon}
          />
        </div>
        <p className="mt-3 font-medium">
          {t("generated.dashboard.notifications.notifications")}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {t("generated.dashboard.notifications.everythingLooksGood")}
        </p>
      </motion.div>
    )
  } else {
    notificationsListContent = (
      <div className="divide-y">
        {notifications.map((notification) => {
          const statusConfig = getStatusConfig(notification.alert.status)
          const icon = getNotificationIcon(notification.alert.alertType)

          return (
            <motion.button
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "group/item flex w-full gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                !notification.read && "bg-primary/5"
              )}
              initial={{ opacity: 0, x: 20 }}
              key={notification.id}
              onClick={() => handleMarkAsRead(notification)}
              type="button"
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover/item:scale-105",
                  statusConfig.bg
                )}
              >
                <HugeiconsIcon
                  className={cn("size-4", statusConfig.text)}
                  icon={icon}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "truncate text-sm",
                        notification.read ? "font-medium" : "font-semibold"
                      )}
                    >
                      {findAlertTitle(notification.alert, t)}
                    </span>
                    {!notification.read && (
                      <span className="flex size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: false,
                      locale: dateFnsLocale,
                    })}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                  {notification.alert.message}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {notification.alert.warehouseName && (
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {notification.alert.warehouseName}
                    </span>
                  )}
                  {notification.alert.rackMarker && (
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {notification.alert.rackMarker}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    )
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative mr-2"
        )}
        title={t("generated.shared.notifications")}
      >
        <HugeiconsIcon
          className="size-5 text-muted-foreground transition-colors group-hover:text-foreground"
          icon={Notification01Icon}
        />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary px-1.5 font-bold text-[10px] text-primary-foreground ring-2 ring-background"
              exit={{ scale: 0, opacity: 0 }}
              initial={{ scale: 0, opacity: 0 }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 gap-0 overflow-hidden p-0"
        sideOffset={8}
      >
        <div className="relative overflow-hidden border-b bg-linear-to-br from-card via-card to-primary/2 px-4 py-3">
          <div className="mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-20" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {t("generated.shared.notifications")}
              </h3>
              {unreadCount > 0 && (
                <Badge className="h-5 px-1.5 text-[10px]" variant="secondary">
                  {t("generated.dashboard.notifications.new", {
                    value0: unreadCount,
                  })}
                </Badge>
              )}
            </div>
            <Button
              className="h-7 gap-1.5 text-xs"
              disabled={unreadCount === 0 || markBulkNotifications.isPending}
              onClick={handleMarkAllRead}
              size="sm"
              variant="ghost"
            >
              <HugeiconsIcon className="size-3.5" icon={TickDouble02Icon} />
              {t("generated.dashboard.notifications.readAll")}
            </Button>
          </div>
        </div>

        <ScrollArea className="h-80">{notificationsListContent}</ScrollArea>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/20 p-2">
          <Link
            className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md text-xs transition-colors hover:bg-muted"
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
          >
            {t("generated.shared.seeAll")}
            <HugeiconsIcon className="size-3.5" icon={ArrowRight02Icon} />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
