import { format } from "date-fns"
import { pl } from "date-fns/locale"
import type {
  Notification,
  NotificationType,
} from "@/components/dashboard/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  getSeverityLabel,
  getSeverityVariant,
  getTypeLabel,
} from "../utils/notification-utils"

interface NotificationDetailProps {
  notification: Notification | null
  onDismiss?: (id: string) => void
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold" : ""}>{value}</span>
    </div>
  )
}

const metadataRenderers: Record<
  NotificationType,
  (meta: Record<string, unknown>) => React.ReactNode
> = {
  UNAUTHORIZED_REMOVAL: (meta) => {
    const { weightDelta, previousWeight, currentWeight } = meta as {
      weightDelta: number
      previousWeight: number
      currentWeight: number
    }
    return (
      <>
        <DetailRow label="Poprzednia waga" value={`${previousWeight} kg`} />
        <DetailRow label="Obecna waga" value={`${currentWeight} kg`} />
        <DetailRow
          highlight
          label="Różnica"
          value={`${weightDelta > 0 ? "+" : ""}${weightDelta} kg`}
        />
      </>
    )
  },
  RACK_OVERWEIGHT: (meta) => {
    const { maxWeight, currentWeight } = meta as {
      maxWeight: number
      currentWeight: number
    }
    return (
      <>
        <DetailRow label="Maksymalna waga" value={`${maxWeight} kg`} />
        <DetailRow label="Obecna waga" value={`${currentWeight} kg`} />
        <DetailRow
          highlight
          label="Przekroczenie"
          value={`+${currentWeight - maxWeight} kg`}
        />
      </>
    )
  },
  TEMPERATURE_VIOLATION: (meta) => {
    const { minTemp, maxTemp, currentTemp } = meta as {
      minTemp: number
      maxTemp: number
      currentTemp: number
    }
    return (
      <>
        <DetailRow
          label="Zakres temperatury"
          value={`${minTemp}°C - ${maxTemp}°C`}
        />
        <DetailRow
          highlight
          label="Obecna temperatura"
          value={`${currentTemp}°C`}
        />
      </>
    )
  },
  ITEM_EXPIRED: (meta) => {
    const { productName, expiryDate } = meta as {
      productName: string
      expiryDate: string
    }
    return (
      <>
        <DetailRow label="Produkt" value={productName} />
        <DetailRow label="Data ważności" value={expiryDate} />
      </>
    )
  },
}

export function NotificationDetail({
  notification,
  onDismiss,
}: NotificationDetailProps) {
  if (!notification) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">
        Wybierz powiadomienie, aby zobaczyć szczegóły
      </div>
    )
  }

  const renderMetadata = metadataRenderers[notification.type]

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center gap-2">
        <Badge variant={getSeverityVariant(notification.severity)}>
          {getSeverityLabel(notification.severity)}
        </Badge>
        <Badge variant="outline">{getTypeLabel(notification.type)}</Badge>
      </div>

      <h2 className="mb-2 font-bold text-lg">{notification.title}</h2>
      <p className="mb-4 text-muted-foreground text-sm">
        {notification.description}
      </p>

      <Separator className="my-4" />

      <div className="mb-4 space-y-2">
        {notification.rackId && (
          <DetailRow label="Regał" value={notification.rackId} />
        )}
        {notification.warehouseId && (
          <DetailRow label="Magazyn" value={notification.warehouseId} />
        )}
        {notification.itemId && (
          <DetailRow label="Produkt" value={notification.itemId} />
        )}
      </div>

      <Separator className="my-4" />

      <div className="space-y-2">{renderMetadata(notification.metadata)}</div>

      <Separator className="my-4" />

      <DetailRow
        label="Data"
        value={format(new Date(notification.createdAt), "dd MMM yyyy, HH:mm", {
          locale: pl,
        })}
      />

      {onDismiss && (
        <div className="mt-auto pt-4">
          <Button onClick={() => onDismiss(notification.id)} variant="outline">
            Usuń
          </Button>
        </div>
      )}
    </div>
  )
}
