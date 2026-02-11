import { useTranslations } from "next-intl"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { getDaysUntilExpiry } from "../../utils/helpers"

interface ExpiryBadgeProps {
  expiryDate?: Date
}

export function ExpiryBadge({ expiryDate }: ExpiryBadgeProps) {
  const t = useTranslations()

  const days = useMemo(() => {
    if (!expiryDate) {
      return undefined
    }
    return getDaysUntilExpiry(new Date(), expiryDate)
  }, [expiryDate])
  if (days === undefined) {
    return (
      <Badge variant="outline">{t("generated.shared.dataAvailable")}</Badge>
    )
  }
  if (days < 0) {
    return (
      <Badge variant="destructive">
        {t("generated.dashboard.shared.expired")}
      </Badge>
    )
  }
  if (days <= 3) {
    return (
      <Badge variant="destructive">
        {t("generated.dashboard.shared.pluralLabel", {
          value0: days,
        })}
      </Badge>
    )
  }
  if (days <= 7) {
    return (
      <Badge className="bg-yellow-500 text-white" variant="default">
        {t("generated.dashboard.items.days", { value0: days })}
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      {t("generated.dashboard.shared.pluralLabel", {
        value0: days,
      })}
    </Badge>
  )
}
