"use client"

import { PackageIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { addDays, formatDate } from "date-fns"
import Image from "next/image"
import type * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"
import type { Item } from "../types"
import { formatDimensions, getDaysUntilExpiry } from "../utils/helpers"
import {
  getItemStatus,
  getStatusColors,
  getStatusText,
  type ItemStatus,
} from "../utils/item-status"

interface ItemDetailsDialogProps {
  item: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
  rackName?: string
  coordinate?: string | null
}

type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>["variant"]>

function formatExpiryHint(daysUntilExpiry: number): string {
  if (daysUntilExpiry === 0) {
    return translateMessage("generated.m1112")
  }

  const absDays = Math.abs(daysUntilExpiry)
  const daysLabel = translateMessage("generated.m1105", { value0: absDays })
  if (daysUntilExpiry < 0) {
    return translateMessage("generated.m1113", { value0: daysLabel })
  }

  return translateMessage("generated.m1114", { value0: daysLabel })
}

function getStatusBadgeVariant(status: ItemStatus): BadgeVariant {
  if (status === "normal") {
    return "success"
  }
  if (status === "expired") {
    return "warning"
  }
  return "destructive"
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono font-semibold">{value}</span>
    </div>
  )
}

export function ItemDetailsDialog({
  item,
  open,
  onOpenChange,
  rackName,
  coordinate,
}: ItemDetailsDialogProps) {
  if (!item) {
    return null
  }

  const status = getItemStatus(item)
  const statusColors = getStatusColors(status)
  const statusText = getStatusText(status)
  const daysUntilExpiry = getDaysUntilExpiry(
    new Date(),
    item.expiryDate ?? addDays(new Date(), item.daysToExpiry)
  )
  const expiryHint = formatExpiryHint(daysUntilExpiry)
  const badgeVariant = getStatusBadgeVariant(status)

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="text-xl">{item.name}</DialogTitle>
              <DialogDescription>
                {rackName ? `${rackName} · ` : ""}
                {item.qrCode}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn("size-2.5 rounded-full", statusColors.dot)} />
              <span className={cn("font-medium text-sm", statusColors.text)}>
                {statusText}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted/30">
            {item.imageUrl ? (
              <Image
                alt={item.name}
                className="object-cover"
                fill
                sizes="200px"
                src={item.imageUrl}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10">
                  <HugeiconsIcon
                    className="size-8 text-primary"
                    icon={PackageIcon}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {coordinate && (
                <Badge className="font-mono" variant="outline">
                  {coordinate}
                </Badge>
              )}
              <Badge variant={badgeVariant}>{expiryHint}</Badge>
            </div>

            <div className="space-y-2 text-xs">
              <DetailRow
                label={translateMessage("generated.m0969")}
                value={item.id}
              />
              <DetailRow
                label={translateMessage("generated.m0499")}
                value={item.qrCode}
              />
              <DetailRow
                label={translateMessage("generated.m0948")}
                value={`${item.weight.toFixed(2)} kg`}
              />
              <DetailRow
                label={translateMessage("generated.m0985")}
                value={formatDimensions(item)}
              />
              <DetailRow
                label={translateMessage("generated.m0924")}
                value={`${item.minTemp}°C – ${item.maxTemp}°C`}
              />
              <DetailRow
                label={translateMessage("generated.m0466")}
                value={
                  <span
                    className={cn("font-mono font-semibold", statusColors.text)}
                  >
                    {formatDate(
                      item.expiryDate ?? addDays(new Date(), item.daysToExpiry),
                      "dd.MM.yyyy"
                    )}
                  </span>
                }
              />
            </div>

            {item.comment && (
              <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                <p className="font-semibold text-muted-foreground">
                  {translateMessage("generated.m0993")}
                </p>
                <p className="mt-1 text-foreground text-sm">{item.comment}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
