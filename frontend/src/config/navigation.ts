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
      {
        title: "Ustawienia",
        href: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
] as const

export const dockActions = [
  {
    title: "Skaner",
    href: "#",
    icon: GroupItemsIcon,
    pwaOnly: true,
  },
]
