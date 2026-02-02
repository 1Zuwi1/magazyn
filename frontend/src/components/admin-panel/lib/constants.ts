import {
  Alert01Icon,
  InboxIcon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"

export const ADMIN_NAV_LINKS = [
  { title: "Przegląd", url: "/dashboard/admin" },
  { title: "Użytkownicy", url: "/dashboard/admin/users" },
  { title: "Magazyny", url: "/dashboard/admin/warehouses" },
  { title: "Powiadomienia", url: "/dashboard/admin/notifications" },
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

export const THRESHOLD = 90
export const MAX_TOAST_ROWS = 7
