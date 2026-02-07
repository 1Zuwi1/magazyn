import {
  Analytics01Icon,
  Bell,
  Package,
  Settings,
  UserIcon,
  WarehouseIcon,
  WaveTriangleIcon,
} from "@hugeicons/core-free-icons"

export interface NavigationItem {
  title: string
  href: string
  icon: typeof Analytics01Icon
  items?: {
    title: string
    href: string
    icon: typeof Analytics01Icon
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
        title: "Powiadomienia",
        href: "/admin/notifications",
        icon: Bell,
      },
    ],
  },
] as const
