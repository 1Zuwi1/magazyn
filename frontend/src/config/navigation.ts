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
    title: translateMessage("generated.shared.mainPanel"),
    href: "/dashboard",
    icon: Analytics01Icon,
    items: [
      {
        title: translateMessage("generated.shared.warehouses"),
        href: "/dashboard/warehouse",
        icon: WarehouseIcon,
      },
      {
        title: translateMessage("generated.shared.assortment"),
        href: "/dashboard/items",
        icon: Package,
      },
      {
        title: translateMessage("generated.shared.notifications"),
        href: "/dashboard/notifications",
        icon: Bell,
      },
    ],
  },
  {
    title: translateMessage("generated.shared.settings"),
    href: "/settings",
    icon: Settings,
    items: [],
  },
  {
    title: translateMessage("generated.shared.administrationPanel"),
    href: "/admin",
    icon: WaveTriangleIcon,
    adminOnly: true,
    items: [
      {
        title: translateMessage("generated.shared.users"),
        href: "/admin/users",
        icon: UserIcon,
      },
      {
        title: translateMessage("generated.shared.warehouses"),
        href: "/admin/warehouses",
        icon: WarehouseIcon,
      },
      {
        title: translateMessage("generated.shared.items"),
        href: "/admin/items",
        icon: Package,
      },
      {
        title: translateMessage("generated.shared.alerts"),
        href: "/admin/alerts",
        icon: Alert01Icon,
      },
      {
        title: translateMessage("generated.shared.rackReports"),
        href: "/admin/rack-reports",
        icon: Attachment01Icon,
      },
      {
        title: translateMessage("generated.shared.operationsAudit"),
        href: "/admin/audit",
        icon: Analytics01Icon,
      },
    ],
  },
] as const
