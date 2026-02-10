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
import { translateMessage } from "@/i18n/translate-message"

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
    title: translateMessage("generated.m0428"),
    href: "/dashboard",
    icon: Analytics01Icon,
    items: [
      {
        title: translateMessage("generated.m0886"),
        href: "/dashboard/warehouse",
        icon: WarehouseIcon,
      },
      {
        title: translateMessage("generated.m0882"),
        href: "/dashboard/items",
        icon: Package,
      },
      {
        title: translateMessage("generated.m0988"),
        href: "/dashboard/notifications",
        icon: Bell,
      },
    ],
  },
  {
    title: translateMessage("generated.m1010"),
    href: "/settings",
    icon: Settings,
    items: [],
  },
  {
    title: translateMessage("generated.m0243"),
    href: "/admin",
    icon: WaveTriangleIcon,
    adminOnly: true,
    items: [
      {
        title: translateMessage("generated.m0233"),
        href: "/admin/users",
        icon: UserIcon,
      },
      {
        title: translateMessage("generated.m0886"),
        href: "/admin/warehouses",
        icon: WarehouseIcon,
      },
      {
        title: translateMessage("generated.m0931"),
        href: "/admin/items",
        icon: Package,
      },
      {
        title: translateMessage("generated.m0901"),
        href: "/admin/alerts",
        icon: Alert01Icon,
      },
      {
        title: translateMessage("generated.m0234"),
        href: "/admin/rack-reports",
        icon: Attachment01Icon,
      },
      {
        title: translateMessage("generated.m0190"),
        href: "/admin/audit",
        icon: Analytics01Icon,
      },
    ],
  },
] as const
