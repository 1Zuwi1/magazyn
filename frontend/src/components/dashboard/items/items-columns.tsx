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
import type { useAppTranslations } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"
import { SortableHeader, StaticHeader } from "./sortable-header"
import type { ItemStats } from "./types"
export const getItemsColumns = (
  t: ReturnType<typeof useAppTranslations>
): ColumnDef<ItemStats>[] => [
  {
    accessorKey: "definition.name",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {t("generated.shared.name")}
      </SortableHeader>
    ),
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
    enableSorting: true,
  },
  {
    accessorKey: "definition.category",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {t("generated.dashboard.items.category")}
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.definition.category}</Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "totalQuantity",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {t("generated.dashboard.items.quantity")}
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="font-medium font-mono">
        {row.original.totalQuantity} {t("generated.dashboard.items.pcs")}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "daysUntilExpiry",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {t("generated.dashboard.items.quantity")}
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const { daysUntilExpiry } = row.original
      if (typeof daysUntilExpiry === "number") {
        return (
          <Badge variant="secondary">
            {t("generated.dashboard.shared.pluralLabel", {
              value0: daysUntilExpiry,
            })}
          </Badge>
        )
      }
      return (
        <Badge variant="outline">{t("generated.dashboard.items.date")}</Badge>
      )
    },
  },
  {
    accessorKey: "definition.isDangerous",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {t("generated.dashboard.items.danger")}
      </SortableHeader>
    ),
    cell: ({ row }) =>
      row.original.definition.isDangerous ? (
        <Badge variant="destructive">{t("generated.shared.dangerous")}</Badge>
      ) : (
        <Badge variant="outline">{t("generated.shared.safe")}</Badge>
      ),
    enableSorting: true,
  },
  {
    id: "actions",
    header: () => <StaticHeader>{t("generated.shared.shares")}</StaticHeader>,
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={t("generated.shared.openMenu")}>
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
              {t("generated.shared.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                console.log("Delete definition", row.original.definitionId)
              }}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
              {t("generated.shared.remove")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
  },
]
