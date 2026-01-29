import { useState } from "react"
import type { Notification } from "@/components/dashboard/types"

export function useNotification(notifications: Notification[]) {
  const [notification, setNotification] = useState<Notification | null>(
    notifications[0] ?? null
  )

  return [notification, setNotification] as const
}
