import {
  Alert01Icon,
  InboxIcon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons"
import { translateMessage } from "@/i18n/translate-message"

export const ADMIN_NAV_LINKS = [
  { title: translateMessage("generated.m0087"), url: "/admin" },
  { title: translateMessage("generated.m0233"), url: "/admin/users" },
  { title: translateMessage("generated.m0886"), url: "/admin/warehouses" },
  { title: translateMessage("generated.m0931"), url: "/admin/items" },
  { title: translateMessage("generated.m0901"), url: "/admin/alerts" },
  { title: translateMessage("generated.m0234"), url: "/admin/rack-reports" },
  { title: translateMessage("generated.m0190"), url: "/admin/audit" },
] as const

export const NOTIFICATIONS_NAV_LINKS = [
  {
    title: translateMessage("generated.m0935"),
    icon: InboxIcon,
    filterValue: null,
  },
  {
    title: translateMessage("generated.m0235"),
    icon: WeightScale01Icon,
    filterValue: "RACK_OVERWEIGHT" as const,
  },
  {
    title: translateMessage("generated.m0936"),
    icon: Alert01Icon,
    filterValue: "UNAUTHORIZED_REMOVAL" as const,
  },
]
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
