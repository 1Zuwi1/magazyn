import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
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
    return <Badge variant="outline">Brak danych</Badge>
  }
  if (days < 0) {
    return <Badge variant="destructive">Przeterminowane</Badge>
  }
  if (days <= 3) {
    return <Badge variant="destructive">{days} dni</Badge>
  }
  if (days <= 7) {
    return (
      <Badge className="bg-yellow-500 text-white" variant="default">
        za {days} dni
      </Badge>
    )
  }
  return <Badge variant="outline">{days} dni</Badge>
}
