import {
  Alert01Icon,
  Analytics01Icon,
  Attachment01Icon,
  Bell,
  Package,
  Settings,
  UserIcon,
  WarehouseIcon,
  WaveTriangleIcon,
} from "@hugeicons/core-free-icons"
import type { IconComponent } from "@/components/dashboard/types"

export interface NavigationItem {
  title: string
  href: string
  icon: IconComponent
  items?: {
    title: string
    href: string
    icon: IconComponent
  }[]
  adminOnly?: boolean
}

export const navigationItems: NavigationItem[] = [
  {
    title: "Panel główny",
    href: "/dashboard",
    icon: Analytics01Icon,
    items: [
      {
        title: "Magazyny",
        href: "/dashboard/warehouse",
        icon: WarehouseIcon,
      },
      {
        title: "Asortyment",
        href: "/dashboard/items",
        icon: Package,
      },
      {
        title: "Powiadomienia",
        href: "/dashboard/notifications",
        icon: Bell,
      },
    ],
  },
  {
    title: "Ustawienia",
    href: "/settings",
    icon: Settings,
    items: [],
  },
  {
    title: "Panel administracyjny",
    href: "/admin",
    icon: WaveTriangleIcon,
    adminOnly: true,
    items: [
      {
        title: "Użytkownicy",
        href: "/admin/users",
        icon: UserIcon,
      },
      {
        title: "Magazyny",
        href: "/admin/warehouses",
        icon: WarehouseIcon,
      },
      {
        title: "Przedmioty",
        href: "/admin/items",
        icon: Package,
      },
      {
        title: "Alerty",
        href: "/admin/alerts",
        icon: Alert01Icon,
      },
      {
        title: "Raporty regałów",
        href: "/admin/rack-reports",
        icon: Attachment01Icon,
      },
      {
        title: "Audyt operacji",
        href: "/admin/audit",
        icon: Analytics01Icon,
      },
    ],
  },
] as const
