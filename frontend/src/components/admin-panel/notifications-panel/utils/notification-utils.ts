import type {
  NotificationSeverity,
  NotificationType,
} from "@/components/dashboard/types"
export function getSeverityVariant(
  severity: NotificationSeverity
): "destructive" | "warning" | "secondary" {
  if (severity === "critical") {
    return "destructive"
  }
  if (severity === "warning") {
    return "warning"
  }
  return "secondary"
}

export function getSeverityLabel(severity: NotificationSeverity): string {
  if (severity === "critical") {
    return "Krytyczne"
  }
  if (severity === "warning") {
    return "Ostrzeżenie"
  }
  return "Informacja"
}

export function getTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    UNAUTHORIZED_REMOVAL: "Nieautoryzowane pobranie",
    RACK_OVERWEIGHT: "Przeciążenie regału",
    ITEM_EXPIRED: "Przeterminowany produkt",
    TEMPERATURE_VIOLATION: "Naruszenie temperatury",
  }
  return labels[type]
}
