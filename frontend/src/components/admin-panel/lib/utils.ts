import type { Notification } from "@/components/dashboard/types"

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number
    sizeType?: "accurate" | "normal"
  } = {}
): string {
  const { decimals = 0, sizeType = "normal" } = opts

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"]

  if (bytes === 0) {
    return "0 Bytes"
  }

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = sizeType === "accurate" ? accurateSizes[i] : sizes[i]

  return `${(bytes / 1024 ** i).toFixed(decimals)} ${size}`
}

export function countUnreadNotifications(
  notifications: Notification[]
): number {
  return notifications.filter((notification) => !notification.read).length
}
