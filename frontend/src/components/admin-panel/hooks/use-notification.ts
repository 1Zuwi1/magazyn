import { useState } from "react"
import type { Notification } from "@/components/dashboard/types"

export function useNotification(initialNotifications: Notification[]) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications)
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(initialNotifications[0] ?? null)

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
    notifications,
    selectedNotification,
    setSelectedNotification,
    markAllAsRead,
    dismiss,
  }
}
