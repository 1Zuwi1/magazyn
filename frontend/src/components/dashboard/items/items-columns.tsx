"use client"

import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { ItemStats } from "./types"

type Translator = (
  key: string,
  values?: Record<string, string | number>
) => string

const getDaysUntilExpiryBadge = (t: Translator, days: number | undefined) => {
  if (days === undefined) {
    return <Badge variant="outline">{t("itemsTable.expiry.noData")}</Badge>
  }
  if (days < 0) {
    return <Badge variant="destructive">{t("itemsTable.expiry.expired")}</Badge>
  }
  if (days < 14) {
    return (
      <Badge variant="warning">
        {t("itemsTable.expiry.inDays", { count: days })}
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      {t("itemsTable.expiry.days", { count: days })}
    </Badge>
  )
}

export const createItemsColumns = (t: Translator): ColumnDef<ItemStats>[] => [
  {
    accessorKey: "definition.name",
    header: t("itemsTable.columns.name"),
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
            {definition.description && (
              <div className="text-muted-foreground text-sm">
                {definition.description}
              </div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "definition.category",
    header: t("itemsTable.columns.category"),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.definition.category}</Badge>
    ),
  },
  {
    accessorKey: "totalQuantity",
    header: t("itemsTable.columns.quantity"),
    cell: ({ row }) => (
      <div className="font-medium">
        {t("itemsTable.columns.quantityValue", {
          count: String(row.original.totalQuantity),
        })}
      </div>
    ),
  },
  {
    accessorKey: "daysUntilExpiry",
    header: t("itemsTable.columns.expiry"),
    cell: ({ row }) => getDaysUntilExpiryBadge(t, row.original.daysUntilExpiry),
  },
  {
    accessorKey: "definition.isDangerous",
    header: t("itemsTable.columns.danger"),
    cell: ({ row }) =>
      row.original.definition.isDangerous ? (
        <Badge variant="destructive">{t("itemsTable.badges.dangerous")}</Badge>
      ) : (
        <Badge variant="outline">{t("itemsTable.badges.safe")}</Badge>
      ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={t("itemsTable.actions.open")}>
            <HugeiconsIcon
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-xs" })
              )}
              icon={MoreHorizontalIcon}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                console.log("Edit definition", row.original.definitionId)
              }}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilIcon} />
              {t("itemsTable.actions.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                console.log("Delete definition", row.original.definitionId)
              }}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
              {t("itemsTable.actions.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
