import { useMemo, useState } from "react"
import type {
  Notification,
  NotificationType,
} from "@/components/dashboard/types"

export function useNotification(initialNotifications: Notification[]) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications)
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(initialNotifications[0] ?? null)
  const [filterType, setFilterType] = useState<NotificationType | null>(null)

  const filteredNotifications = useMemo(() => {
    if (filterType === null) {
      return notifications
    }
    return notifications.filter(
      (notification) => notification.type === filterType
    )
  }, [notifications, filterType])

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    )
  }

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (selectedNotification?.id === id) {
      setSelectedNotification(null)
    }
  }

  return {
    notifications: filteredNotifications,
    filterType,
    setFilterType,
    selectedNotification,
    setSelectedNotification,
    markAllAsRead,
    dismiss,
  }
}
