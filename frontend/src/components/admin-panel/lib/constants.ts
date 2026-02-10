import {
  Alert01Icon,
  InboxIcon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import type { Role, Status, User } from "@/components/dashboard/types"

export const ADMIN_NAV_LINKS = [
  { title: "Przegląd", url: "/admin" },
  { title: "Użytkownicy", url: "/admin/users" },
  { title: "Magazyny", url: "/admin/warehouses" },
  { title: "Asortyment", url: "/admin/assortment" },
  { title: "Powiadomienia", url: "/admin/notifications" },
  { title: "Raporty", url: "/admin/reports" },
] as const

export const NOTIFICATIONS_NAV_LINKS = [
  { title: "Wszystkie", icon: InboxIcon, filterValue: null },
  {
    title: "Przeciążenia",
    icon: WeightScale01Icon,
    filterValue: "RACK_OVERWEIGHT" as const,
  },
  {
    title: "Nieautoryzowane",
    icon: Alert01Icon,
    filterValue: "UNAUTHORIZED_REMOVAL" as const,
  },
]
export const DEFAULT_RACK = {
  symbol: "",
  name: "",
  rows: 0,
  cols: 0,
  minTemp: 0,
  maxTemp: 0,
  maxWeight: 0,
  maxItemWidth: 1,
  maxItemHeight: 1,
  maxItemDepth: 1,
  comment: "",
}

export const DEFAULT_USER: User = {
  id: "",
  username: "",
  email: "",
  team: "",
  status: "ACTIVE" as Status,
  role: "USER" as Role,
}

export const THRESHOLD = 90
export const MAX_TOAST_ROWS = 7
