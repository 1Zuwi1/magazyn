import {
  Analytics01Icon,
  GroupItemsIcon,
  Package,
  Settings,
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
        icon: Package,
      },
      {
        title: "Asortyment",
        href: "/dashboard/items",
        icon: GroupItemsIcon,
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
    items: [],
  },
] as const
