"use client"

import {
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  QrCodeIcon,
  Trash,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { useMemo } from "react"
import type { TranslationValues } from "use-intl/core"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Locale } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { formatDate, getDaysUntilExpiry } from "../utils/helpers"
import type { ItemInstance } from "./types"

type Translator = (key: string, values?: TranslationValues) => string

interface AssortmentColumnOptions {
  t: Translator
  locale: Locale
}

const getExpiryBadge = (t: Translator, expiryDate: Date) => {
  const days = getDaysUntilExpiry(new Date(), expiryDate)

  if (days < 0) {
    return (
      <Badge variant="destructive">
        {t("assortmentTable.expiry.expired", { days: Math.abs(days) })}
      </Badge>
    )
  }

  if (days === 0) {
    return (
      <Badge variant="destructive">{t("assortmentTable.expiry.today")}</Badge>
    )
  }

  const dayLabel = t("assortmentTable.expiry.days", { count: days })

  if (days <= 3) {
    return <Badge variant="destructive">{dayLabel}</Badge>
  }

  if (days <= 7) {
    return (
      <Badge className="bg-orange-500" variant="default">
        {dayLabel}
      </Badge>
    )
  }

  if (days <= 14) {
    return (
      <Badge className="bg-yellow-500" variant="default">
        {dayLabel}
      </Badge>
    )
  }

  return <Badge variant="outline">{dayLabel}</Badge>
}

export const createAssortmentColumns = ({
  t,
  locale,
}: AssortmentColumnOptions): ColumnDef<ItemInstance>[] => [
  {
    id: "category",
    accessorKey: "definition.category",
    header: t("assortmentTable.columns.category"),
    enableHiding: true,
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.definition.category}</Badge>
    ),
  },
  {
    accessorKey: "definition.name",
    header: t("assortmentTable.columns.name"),
    cell: ({ row }) => {
      const definition = row.original.definition
      return (
        <div className="flex items-center gap-3">
          {definition.imageUrl && (
            <Image
              alt={definition.name}
              className="h-10 w-10 rounded object-cover"
              height={40}
              src={definition.imageUrl}
              width={40}
            />
          )}
          <div>
            <div className="font-medium">{definition.name}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "rackName",
    header: t("assortmentTable.columns.rack"),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.rackName}</div>
        <div className="text-muted-foreground text-sm">
          row: row.original.position.row,
          {t("assortmentTable.columns.position", {
            col: row.original.position.col,
          })}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "qrCode",
    header: t("assortmentTable.columns.qr"),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          className="h-4 w-4 text-muted-foreground"
          icon={QrCodeIcon}
        />
        <span className="font-mono text-sm">{row.original.qrCode}</span>
      </div>
    ),
  },
  {
    accessorKey: "addedDate",
    header: t("assortmentTable.columns.addedDate"),
    cell: ({ row }) => formatDate(row.original.addedDate, locale),
  },
  {
    accessorKey: "expiryDate",
    header: t("assortmentTable.columns.expiryDate"),
    cell: ({ row }) => {
      const expiryBadge = useMemo(() => {
        return getExpiryBadge(t, row.original.expiryDate)
      }, [row.original.expiryDate, t])
      return (
        <div className="space-y-1">
          <div className="text-sm">
            {formatDate(row.original.expiryDate, locale)}
          </div>
          {expiryBadge}
        </div>
      )
    },
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={t("assortmentTable.actions.open")}>
            <HugeiconsIcon
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-xs" })
              )}
              icon={MoreHorizontalIcon}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => console.log("View", item.id)}>
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={EyeIcon} />
              {t("assortmentTable.actions.details")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Edit", item.id)}>
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilIcon} />
              {t("assortmentTable.actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log("Show QR", item.qrCode)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={QrCodeIcon} />
              {t("assortmentTable.actions.showQr")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => console.log("Delete", item.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
              {t("assortmentTable.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
