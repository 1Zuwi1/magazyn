"use client"

import {
  Alert01Icon,
  ArrowRight02Icon,
  Delete02Icon,
  InboxIcon,
  Notification01Icon,
  ThermometerIcon,
  TickDouble02Icon,
  Time01Icon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"

import type {
  Notification,
  NotificationSeverity,
  NotificationType,
} from "@/components/dashboard/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

function getNotificationIcon(type: NotificationType): IconSvgElement {
  const icons: Record<NotificationType, IconSvgElement> = {
    UNAUTHORIZED_REMOVAL: Alert01Icon,
    RACK_OVERWEIGHT: WeightScale01Icon,
    ITEM_EXPIRED: Time01Icon,
    TEMPERATURE_VIOLATION: ThermometerIcon,
  }
  return icons[type]
}

function getSeverityConfig(severity: NotificationSeverity) {
  switch (severity) {
    case "CRITICAL":
      return {
        bg: "bg-destructive/10",
        text: "text-destructive",
        border: "border-destructive/20",
      }
    case "WARNING":
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-500/20",
      }
    default:
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
      }
  }
}

export function NotificationInbox() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleClearAll = () => {
    setNotifications([])
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
        {/* Header */}
        <div className="relative overflow-hidden border-b bg-linear-to-br from-card via-card to-primary/2 px-4 py-3">
          {/* Decorative grid pattern */}
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
              disabled={unreadCount === 0}
              onClick={handleMarkAllRead}
              size="sm"
              variant="ghost"
            >
              <HugeiconsIcon className="size-3.5" icon={TickDouble02Icon} />
              Przeczytaj wszystkie
            </Button>
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="h-80">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-12"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key="empty"
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
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  const severityConfig = getSeverityConfig(
                    notification.severity
                  )
                  const Icon = getNotificationIcon(notification.type)

                  return (
                    <motion.button
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "group/item flex w-full gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                        !notification.read && "bg-primary/5"
                      )}
                      exit={{ opacity: 0, x: -20 }}
                      initial={{ opacity: 0, x: 20 }}
                      key={notification.id}
                      layout
                      onClick={() => handleMarkAsRead(notification.id)}
                      type="button"
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover/item:scale-105",
                          severityConfig.bg
                        )}
                      >
                        <HugeiconsIcon
                          className={cn("size-4", severityConfig.text)}
                          icon={Icon}
                        />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "truncate text-sm",
                                notification.read
                                  ? "font-medium"
                                  : "font-semibold"
                              )}
                            >
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <span className="flex size-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              { addSuffix: false, locale: pl }
                            )}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">
                          {notification.description}
                        </p>

                        {/* Location tags */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {notification.warehouseId && (
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {notification.warehouseId}
                            </span>
                          )}
                          {notification.rackId && (
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {notification.rackId}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t bg-muted/20 p-2">
          <Link
            className="flex h-8 flex-1 items-center justify-center gap-2 rounded-md text-xs transition-colors hover:bg-muted"
            href="/admin/notifications"
            onClick={() => setOpen(false)}
          >
            Zobacz wszystkie
            <HugeiconsIcon className="size-3.5" icon={ArrowRight02Icon} />
          </Link>
          <Button
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            disabled={notifications.length === 0}
            onClick={handleClearAll}
            size="icon"
            title="Wyczyść wszystkie powiadomienia"
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={Delete02Icon} />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
