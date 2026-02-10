import {
  Alert01Icon,
  InboxIcon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import { translateMessage } from "@/i18n/translate-message"

export const getAdminNavLinks = () =>
  [
    { title: translateMessage("generated.shared.review"), url: "/admin" },
    { title: translateMessage("generated.shared.users"), url: "/admin/users" },
    {
      title: translateMessage("generated.shared.warehouses"),
      url: "/admin/warehouses",
    },
    { title: translateMessage("generated.shared.items"), url: "/admin/items" },
    {
      title: translateMessage("generated.shared.alerts"),
      url: "/admin/alerts",
    },
    {
      title: translateMessage("generated.shared.rackReports"),
      url: "/admin/rack-reports",
    },
    {
      title: translateMessage("generated.shared.operationsAudit"),
      url: "/admin/audit",
    },
  ] as const

export const getNotificationsNavLinks = () =>
  [
    {
      title: translateMessage("generated.shared.all"),
      icon: InboxIcon,
      filterValue: null,
    },
    {
      title: translateMessage("generated.admin.shared.overloads"),
      icon: WeightScale01Icon,
      filterValue: "RACK_OVERWEIGHT" as const,
    },
    {
      title: translateMessage("generated.admin.shared.unauthorized"),
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
