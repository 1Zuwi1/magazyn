import {
  Alert01Icon,
  InboxIcon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import type { AppTranslate } from "@/i18n/use-translations"

export const getAdminNavLinks = (t: AppTranslate) =>
  [
    { title: t("generated.shared.review"), url: "/admin" },
    { title: t("generated.shared.users"), url: "/admin/users" },
    {
      title: t("generated.shared.warehouses"),
      url: "/admin/warehouses",
    },
    { title: t("generated.shared.items"), url: "/admin/items" },
    {
      title: t("generated.shared.alerts"),
      url: "/admin/alerts",
    },
    {
      title: t("generated.shared.rackReports"),
      url: "/admin/rack-reports",
    },
    {
      title: t("generated.shared.operationsAudit"),
      url: "/admin/audit",
    },
  ] as const

export const getNotificationsNavLinks = (t: AppTranslate) =>
  [
    {
      title: t("generated.shared.all"),
      icon: InboxIcon,
      filterValue: null,
    },
    {
      title: t("generated.admin.shared.overloads"),
      icon: WeightScale01Icon,
      filterValue: "RACK_OVERWEIGHT" as const,
    },
    {
      title: t("generated.admin.shared.unauthorized"),
      icon: Alert01Icon,
      filterValue: "UNAUTHORIZED_REMOVAL" as const,
    },
  ] as const
export const DEFAULT_RACK = {
  marker: "",
  name: "",
  rows: 0,
  cols: 0,
  minTemp: 0,
  maxTemp: 0,
  maxWeight: 0,
  maxItemWidth: 1,
  maxItemHeight: 1,
  maxItemDepth: 1,
  acceptsDangerous: false,
  comment: "",
}

export const THRESHOLD = 90
export const MAX_TOAST_ROWS = 7
