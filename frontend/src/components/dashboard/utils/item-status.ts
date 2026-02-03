import type { Item } from "../types"
import { getDaysUntilExpiry } from "./helpers"

export type ItemStatus =
  | "normal"
  | "expired"
  | "expired-dangerous"
  | "dangerous"

export function getItemStatus(item: Item): ItemStatus {
  const daysUntilExpiry = getDaysUntilExpiry(
    new Date(),
    item.expiryDate ??
      new Date(Date.now() + item.daysToExpiry * 24 * 60 * 60 * 1000)
  )
  const isExpired = daysUntilExpiry < 0

  if (isExpired && item.isDangerous) {
    return "expired-dangerous"
  }
  if (isExpired) {
    return "expired"
  }
  if (item.isDangerous) {
    return "dangerous"
  }
  return "normal"
}

export function getStatusText(status: ItemStatus): string {
  if (status === "normal") {
    return "Normalny"
  }
  if (status === "expired") {
    return "Przeterminowany"
  }
  if (status === "expired-dangerous") {
    return "Przeterminowany i niebezpieczny"
  }
  return "Niebezpieczny"
}

export function getStatusColors(status: ItemStatus): {
  dot: string
  bg: string
  text: string
} {
  if (status === "normal") {
    return {
      dot: "bg-emerald-500",
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
    }
  }
  if (status === "expired") {
    return {
      dot: "bg-amber-500",
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
    }
  }
  if (status === "expired-dangerous") {
    return {
      dot: "bg-red-500 ring-2 ring-amber-400",
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
    }
  }
  return {
    dot: "bg-red-500",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  }
}
