import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { translateMessage } from "@/i18n/translate-message"
import { getDaysUntilExpiry } from "../../utils/helpers"

interface ExpiryBadgeProps {
  expiryDate?: Date
}

export function ExpiryBadge({ expiryDate }: ExpiryBadgeProps) {
  const days = useMemo(() => {
    if (!expiryDate) {
      return undefined
    }
    return getDaysUntilExpiry(new Date(), expiryDate)
  }, [expiryDate])
  if (days === undefined) {
    return (
      <Badge variant="outline">{translateMessage("generated.m0472")}</Badge>
    )
  }
  if (days < 0) {
    return (
      <Badge variant="destructive">{translateMessage("generated.m0975")}</Badge>
    )
  }
  if (days <= 3) {
    return (
      <Badge variant="destructive">
        {translateMessage("generated.m1105", { value0: days })}
      </Badge>
    )
  }
  if (days <= 7) {
    return (
      <Badge className="bg-yellow-500 text-white" variant="default">
        {translateMessage("generated.m1074", { value0: days })}
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      {translateMessage("generated.m1105", { value0: days })}
    </Badge>
  )
}
