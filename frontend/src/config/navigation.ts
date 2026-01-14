import {
  Analytics01Icon,
  GroupItemsIcon,
  Package,
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
] as const

export const dockActions = [
  {
    title: "Skaner",
    href: "#",
    icon: GroupItemsIcon,
    pwaOnly: true,
  },
]
