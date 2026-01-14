import { Analytics01Icon, GroupItemsIcon } from "@hugeicons/core-free-icons"

export const navigationItems = [
  {
    title: "Panel główny",
    href: "/dashboard",
    icon: Analytics01Icon,
  },
  {
    title: "Asortyment",
    href: "/dashboard/items",
    icon: GroupItemsIcon,
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
