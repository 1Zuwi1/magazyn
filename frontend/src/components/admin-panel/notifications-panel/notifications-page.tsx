"use client"

import {
  Alert01Icon,
  ArrowRight02Icon,
  CheckmarkBadge01Icon,
  Delete02Icon,
  InboxIcon,
  Notification01Icon,
  ThermometerIcon,
  Time01Icon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { format, formatDistanceToNow } from "date-fns"
import { pl } from "date-fns/locale"
import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useState } from "react"
import { MOCK_NOTIFICATIONS } from "@/components/dashboard/mock-data"
import type {
  Notification,
  NotificationSeverity,
  NotificationType,
} from "@/components/dashboard/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"

// Filter configuration
const NOTIFICATION_FILTERS: {
  label: string
  value: NotificationType | null
  icon: IconSvgElement
}[] = [
  { label: "Wszystkie", value: null, icon: InboxIcon },
  { label: "Przeciążenia", value: "RACK_OVERWEIGHT", icon: WeightScale01Icon },
  {
    label: "Nieautoryzowane",
    value: "UNAUTHORIZED_REMOVAL",
    icon: Alert01Icon,
  },
  {
    label: "Temperatura",
    value: "TEMPERATURE_VIOLATION",
    icon: ThermometerIcon,
  },
  { label: "Przeterminowane", value: "ITEM_EXPIRED", icon: Time01Icon },
]

// Utility functions
function getSeverityConfig(severity: NotificationSeverity) {
  switch (severity) {
    case "critical":
      return {
        variant: "destructive" as const,
        label: "Krytyczne",
        bgColor: "bg-destructive/10",
        textColor: "text-destructive",
        borderColor: "border-destructive/30",
      }
    case "warning":
      return {
        variant: "warning" as const,
        label: "Ostrzeżenie",
        bgColor: "bg-orange-500/10",
        textColor: "text-orange-600 dark:text-orange-400",
        borderColor: "border-orange-500/30",
      }
    default:
      return {
        variant: "secondary" as const,
        label: "Informacja",
        bgColor: "bg-muted",
        textColor: "text-muted-foreground",
        borderColor: "border-border",
      }
  }
}

function getTypeConfig(type: NotificationType) {
  const configs: Record<
    NotificationType,
    { label: string; icon: IconSvgElement }
  > = {
    UNAUTHORIZED_REMOVAL: {
      label: "Nieautoryzowane pobranie",
      icon: Alert01Icon,
    },
    RACK_OVERWEIGHT: { label: "Przeciążenie regału", icon: WeightScale01Icon },
    ITEM_EXPIRED: { label: "Przeterminowany produkt", icon: Time01Icon },
    TEMPERATURE_VIOLATION: {
      label: "Naruszenie temperatury",
      icon: ThermometerIcon,
    },
  }
  return configs[type]
}

// Metadata renderers
const metadataRenderers: Record<
  NotificationType,
  (meta: Record<string, unknown>) => React.ReactNode
> = {
  UNAUTHORIZED_REMOVAL: (meta) => {
    const { weightDelta, previousWeight, currentWeight } = meta as {
      weightDelta: number
      previousWeight: number
      currentWeight: number
    }
    return (
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Poprzednia waga" value={`${previousWeight} kg`} />
        <MetricCard label="Obecna waga" value={`${currentWeight} kg`} />
        <MetricCard
          highlight
          label="Różnica"
          value={`${weightDelta > 0 ? "+" : ""}${weightDelta} kg`}
        />
      </div>
    )
  },
  RACK_OVERWEIGHT: (meta) => {
    const { maxWeight, currentWeight } = meta as {
      maxWeight: number
      currentWeight: number
    }
    return (
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Maksymalna waga" value={`${maxWeight} kg`} />
        <MetricCard label="Obecna waga" value={`${currentWeight} kg`} />
        <MetricCard
          highlight
          label="Przekroczenie"
          value={`+${currentWeight - maxWeight} kg`}
        />
      </div>
    )
  },
  TEMPERATURE_VIOLATION: (meta) => {
    const { minTemp, maxTemp, currentTemp } = meta as {
      minTemp: number
      maxTemp: number
      currentTemp: number
    }
    return (
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Zakres temperatury"
          value={`${minTemp}°C - ${maxTemp}°C`}
        />
        <MetricCard
          highlight
          label="Obecna temperatura"
          value={`${currentTemp}°C`}
        />
      </div>
    )
  },
  ITEM_EXPIRED: (meta) => {
    const { productName, expiryDate } = meta as {
      productName: string
      expiryDate: string
    }
    return (
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Produkt" value={productName} />
        <MetricCard label="Data ważności" value={expiryDate} />
      </div>
    )
  },
}

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        highlight
          ? "border-primary/20 bg-primary/5"
          : "border-border bg-muted/30"
      )}
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-mono font-semibold",
          highlight && "text-primary"
        )}
      >
        {value}
      </p>
    </div>
  )
}

export default function NotificationsMain() {
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [filterType, setFilterType] = useState<NotificationType | null>(null)
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null)

  const filtered = useMemo(() => {
    if (!filterType) {
      return notifications
    }
    return notifications.filter((n) => n.type === filterType)
  }, [notifications, filterType])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (selectedNotification?.id === id) {
      setSelectedNotification(null)
    }
  }

  const handleSelect = (notification: Notification) => {
    setSelectedNotification(notification)
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        actions={
          <Button
            disabled={unreadCount === 0}
            onClick={markAllAsRead}
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
        {/* Quick Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-1.5 backdrop-blur-sm">
            <span className="font-mono font-semibold text-primary">
              {notifications.length}
            </span>
            <span className="text-muted-foreground text-xs">łącznie</span>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-1.5">
              <span className="flex size-2 rounded-full bg-orange-500" />
              <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                {unreadCount}
              </span>
              <span className="text-muted-foreground text-xs">
                nieprzeczytanych
              </span>
            </div>
          )}
        </div>
      </AdminPageHeader>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar - Filters & List */}
        <div className="space-y-4">
          {/* Filter Tabs */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b bg-muted/30 px-4 py-3">
              <h3 className="font-medium text-sm">Filtruj według typu</h3>
            </div>
            <div className="space-y-1 p-2">
              {NOTIFICATION_FILTERS.map((filter) => {
                const count = filter.value
                  ? notifications.filter((n) => n.type === filter.value).length
                  : notifications.length
                const isActive = filterType === filter.value

                return (
                  <button
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    key={filter.label}
                    onClick={() => setFilterType(filter.value)}
                    type="button"
                  >
                    <HugeiconsIcon className="size-4" icon={filter.icon} />
                    <span className="flex-1 font-medium text-sm">
                      {filter.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-xs",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b bg-muted/30 px-4 py-3">
              <h3 className="font-medium text-sm">
                {filterType
                  ? NOTIFICATION_FILTERS.find((f) => f.value === filterType)
                      ?.label
                  : "Wszystkie powiadomienia"}
              </h3>
            </div>
            <ScrollArea className="h-100">
              <div className="p-2 pr-4">
                <AnimatePresence mode="popLayout">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <HugeiconsIcon
                          className="size-6 text-muted-foreground"
                          icon={InboxIcon}
                        />
                      </div>
                      <p className="mt-3 font-medium">Brak powiadomień</p>
                      <p className="mt-1 text-muted-foreground text-sm">
                        Wszystko wygląda dobrze!
                      </p>
                    </div>
                  ) : (
                    filtered.map((notification) => {
                      const severityConfig = getSeverityConfig(
                        notification.severity
                      )
                      const isSelected =
                        selectedNotification?.id === notification.id

                      return (
                        <motion.button
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "mb-2 flex w-full flex-col gap-2 rounded-lg border p-3 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/30 hover:bg-muted/50",
                            !notification.read && "bg-muted/30"
                          )}
                          exit={{ opacity: 0, y: -10 }}
                          initial={{ opacity: 0, y: 10 }}
                          key={notification.id}
                          layout
                          onClick={() => handleSelect(notification)}
                          type="button"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                severityConfig.bgColor
                              )}
                            >
                              <HugeiconsIcon
                                className={cn(
                                  "size-4",
                                  severityConfig.textColor
                                )}
                                icon={getTypeConfig(notification.type).icon}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium text-sm">
                                  {notification.title}
                                </span>
                                {!notification.read && (
                                  <span className="flex size-2 shrink-0 rounded-full bg-primary" />
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-1 text-muted-foreground text-xs">
                                {notification.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <Badge
                              className="text-[10px]"
                              variant={severityConfig.variant}
                            >
                              {severityConfig.label}
                            </Badge>
                            <span className="text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true, locale: pl }
                              )}
                            </span>
                          </div>
                        </motion.button>
                      )
                    })
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <AnimatePresence mode="wait">
            {selectedNotification ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="flex h-full flex-col"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={selectedNotification.id}
              >
                {/* Detail Header */}
                <div className="relative overflow-hidden border-b bg-linear-to-br from-muted/50 via-transparent to-transparent p-6">
                  <div className="mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[2rem_2rem] opacity-20" />

                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          getSeverityConfig(selectedNotification.severity)
                            .variant
                        }
                      >
                        {getSeverityConfig(selectedNotification.severity).label}
                      </Badge>
                      <Badge variant="outline">
                        {getTypeConfig(selectedNotification.type).label}
                      </Badge>
                    </div>
                    <h2 className="mt-3 font-semibold text-xl">
                      {selectedNotification.title}
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                      {selectedNotification.description}
                    </p>
                  </div>
                </div>

                {/* Detail Content */}
                <div className="flex-1 space-y-6 p-6">
                  {/* Location Info */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-muted-foreground text-sm">
                      Lokalizacja
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {selectedNotification.warehouseId && (
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-muted-foreground text-xs">
                            Magazyn
                          </p>
                          <p className="mt-0.5 font-medium">
                            {selectedNotification.warehouseId}
                          </p>
                        </div>
                      )}
                      {selectedNotification.rackId && (
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-muted-foreground text-xs">Regał</p>
                          <p className="mt-0.5 font-medium">
                            {selectedNotification.rackId}
                          </p>
                        </div>
                      )}
                      {selectedNotification.itemId && (
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-muted-foreground text-xs">
                            Produkt
                          </p>
                          <p className="mt-0.5 font-medium">
                            {selectedNotification.itemId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-muted-foreground text-sm">
                      Szczegóły
                    </h3>
                    {metadataRenderers[selectedNotification.type](
                      selectedNotification.metadata
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-muted-foreground text-sm">
                      Data zdarzenia
                    </h3>
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                      <HugeiconsIcon
                        className="size-5 text-muted-foreground"
                        icon={Time01Icon}
                      />
                      <span className="font-medium">
                        {format(
                          new Date(selectedNotification.createdAt),
                          "dd MMMM yyyy, HH:mm",
                          { locale: pl }
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detail Footer */}
                <div className="flex items-center justify-between border-t bg-muted/20 p-4">
                  <Button
                    onClick={() => dismiss(selectedNotification.id)}
                    variant="outline"
                  >
                    <HugeiconsIcon
                      className="mr-2 size-4"
                      icon={Delete02Icon}
                    />
                    Usuń powiadomienie
                  </Button>
                  <Button>
                    Przejdź do lokalizacji
                    <HugeiconsIcon
                      className="ml-2 size-4"
                      icon={ArrowRight02Icon}
                    />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                animate={{ opacity: 1 }}
                className="flex h-full flex-col items-center justify-center p-12"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key="empty"
              >
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <HugeiconsIcon
                    className="size-8 text-muted-foreground"
                    icon={Notification01Icon}
                  />
                </div>
                <p className="mt-4 font-medium text-lg">
                  Wybierz powiadomienie
                </p>
                <p className="mt-1 text-center text-muted-foreground text-sm">
                  Kliknij na powiadomienie z listy, aby zobaczyć szczegóły
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
