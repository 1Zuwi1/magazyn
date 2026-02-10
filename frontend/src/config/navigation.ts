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
import type { AppTranslate } from "@/i18n/use-translations"

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

export const getNavigationItems = (t: AppTranslate): NavigationItem[] =>
  [
    {
      title: t("generated.shared.mainPanel"),
      href: "/dashboard",
      icon: Analytics01Icon,
      items: [
        {
          title: t("generated.shared.warehouses"),
          href: "/dashboard/warehouse",
          icon: WarehouseIcon,
        },
        {
          title: t("generated.shared.assortment"),
          href: "/dashboard/items",
          icon: Package,
        },
        {
          title: t("generated.shared.notifications"),
          href: "/dashboard/notifications",
          icon: Bell,
        },
      ],
    },
    {
      title: t("generated.shared.settings"),
      href: "/settings",
      icon: Settings,
      items: [],
    },
    {
      title: t("generated.shared.administrationPanel"),
      href: "/admin",
      icon: WaveTriangleIcon,
      adminOnly: true,
      items: [
        {
          title: t("generated.shared.users"),
          href: "/admin/users",
          icon: UserIcon,
        },
        {
          title: t("generated.shared.warehouses"),
          href: "/admin/warehouses",
          icon: WarehouseIcon,
        },
        {
          title: t("generated.shared.items"),
          href: "/admin/items",
          icon: Package,
        },
        {
          title: t("generated.shared.alerts"),
          href: "/admin/alerts",
          icon: Alert01Icon,
        },
        {
          title: t("generated.shared.rackReports"),
          href: "/admin/rack-reports",
          icon: Attachment01Icon,
        },
        {
          title: t("generated.shared.operationsAudit"),
          href: "/admin/audit",
          icon: Analytics01Icon,
        },
      ],
    },
  ] as const
