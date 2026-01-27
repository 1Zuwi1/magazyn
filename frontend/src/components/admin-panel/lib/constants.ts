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
  { title: "Wszystkie", label: "Powiadomienia", icon: InboxIcon },
  { title: "Przeciążenia", label: "Przeciążenia", icon: WeightScale01Icon },
  {
    title: "Nieautoryzowane",
    label: "Nieautoryzowane",
    icon: Alert01Icon,
  },
]
