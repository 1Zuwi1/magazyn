import {
  Analytics01Icon,
  GroupItemsIcon,
  QrCodeIcon,
} from "@hugeicons/core-free-icons"

export const navigationItems = [
  {
    title: "Panel główny",
    href: "/dashboard",
    icon: Analytics01Icon,
  },
  {
    title: "Skaner",
    action: "scanner",
    icon: QrCodeIcon,
    pwaOnly: true,
  },
  {
    title: "Asortyment",
    href: "/dashboard/items",
    icon: GroupItemsIcon,
  },
] as (
  | {
      title: string
      href: string
      icon: typeof Analytics01Icon
    }
  | {
      title: string
      action: "scanner"
      icon: typeof Analytics01Icon
      pwaOnly: true
    }
)[]
