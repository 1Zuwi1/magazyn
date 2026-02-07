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
import { pl } from "date-fns/locale"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { type ReactNode, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import useNotifications, {
  type UserNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useUnreadNotificationsCount,
} from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

const NOTIFICATION_PREVIEW_PAGE_SIZE = 20

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

const toTitleCase = (value: string): string =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`)
    .join(" ")

const getNotificationTitle = (notification: UserNotification): string =>
  notification.alert.alertTypeDescription?.trim() ||
  toTitleCase(notification.alert.alertType)

export function NotificationInbox() {
  const [open, setOpen] = useState(false)
  const {
    data: notificationsData,
    isPending: isNotificationsPending,
    isError: isNotificationsError,
  } = useNotifications({
    page: 0,
    size: NOTIFICATION_PREVIEW_PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  })
  const { data: unreadNotificationsCount } = useUnreadNotificationsCount()
  const markAllAsReadMutation = useMarkAllNotificationsAsRead()
  const markAsReadMutation = useMarkNotificationAsRead()

  const notifications = notificationsData?.content ?? []
  const fallbackUnreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  )
  const unreadCount = unreadNotificationsCount ?? fallbackUnreadCount

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate()
  }

  const handleMarkAsRead = (notification: UserNotification) => {
    if (notification.read) {
      return
    }
    markAsReadMutation.mutate(notification.id)
  }

  let notificationsListContent: ReactNode

  if (isNotificationsPending) {
    notificationsListContent = (
      <div className="space-y-2 p-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="h-16 animate-pulse rounded-lg border bg-muted/40"
            key={`notification-skeleton-${index}`}
          />
        ))}
      </div>
    )
  } else if (isNotificationsError) {
    notificationsListContent = (
      <div className="flex h-full flex-col items-center justify-center py-12">
        <p className="font-medium">Nie udało się pobrać powiadomień</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Spróbuj ponownie za chwilę.
        </p>
      </div>
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
        <p className="mt-3 font-medium">Brak powiadomień</p>
        <p className="mt-1 text-muted-foreground text-sm">
          Wszystko wygląda dobrze!
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
                      {getNotificationTitle(notification)}
                    </span>
                    {!notification.read && (
                      <span className="flex size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: false,
                      locale: pl,
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
      <PopoverTrigger className="group relative mr-3 flex size-8 cursor-pointer items-center justify-center rounded-xl bg-background transition-all hover:bg-accent hover:shadow-sm">
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
              <h3 className="font-semibold">Powiadomienia</h3>
              {unreadCount > 0 && (
                <Badge className="h-5 px-1.5 text-[10px]" variant="secondary">
                  {unreadCount} nowe
                </Badge>
              )}
            </div>
            <Button
              className="h-7 gap-1.5 text-xs"
              disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
              onClick={handleMarkAllRead}
              size="sm"
              variant="ghost"
            >
              <HugeiconsIcon className="size-3.5" icon={TickDouble02Icon} />
              Przeczytaj wszystkie
            </Button>
          </div>
        </div>

        <ScrollArea className="h-80">{notificationsListContent}</ScrollArea>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/20 p-2">
          <Link
            className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md text-xs transition-colors hover:bg-muted"
            href="/admin/notifications"
            onClick={() => setOpen(false)}
          >
            Zobacz wszystkie
            <HugeiconsIcon className="size-3.5" icon={ArrowRight02Icon} />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
