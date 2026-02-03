import {
  Analytics01Icon,
  GroupItemsIcon,
  Package,
  Settings,
} from "@hugeicons/core-free-icons"

export const navigationItems = [
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
] as const

export type NavigationItem = (typeof navigationItems)[number]
