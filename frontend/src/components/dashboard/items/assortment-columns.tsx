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
import { formatDate } from "date-fns"
import Image from "next/image"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"
import { CodeCell } from "./components/code-cell"
import { ExpiryBadge } from "./components/expiry-badge"
import { SortableHeader, StaticHeader } from "./sortable-header"
import type { ItemInstance } from "./types"

export const assortmentColumns: ColumnDef<ItemInstance>[] = [
  {
    id: "category",
    accessorKey: "definition.category",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {translateMessage("generated.m0979")}
      </SortableHeader>
    ),
    enableHiding: true,
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.definition.category}</Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "definition.name",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {translateMessage("generated.m0457")}
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
          </div>
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "rackName",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {translateMessage("generated.m0168")}
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.rackName}</div>
        <div className="text-muted-foreground text-sm">
          {translateMessage("generated.m1091", {
            value0: row.original.position.row + 1,
            value1: row.original.position.col + 1,
          })}
        </div>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "qrCode",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {translateMessage("generated.m0906")}
      </SortableHeader>
    ),
    cell: ({ row }) => <CodeCell value={row.original.qrCode} />,
    enableSorting: true,
  },
  {
    accessorKey: "addedDate",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {translateMessage("generated.m0459")}
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {formatDate(row.original.addedDate, "dd.MM.yyyy")}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "expiryDate",
    header: ({ column }) => (
      <SortableHeader column={column}>
        {translateMessage("generated.m0980")}
      </SortableHeader>
    ),
    cell: ({ row }) => {
      const expiryBadge = useMemo(() => {
        return <ExpiryBadge expiryDate={row.original.expiryDate} />
      }, [row.original.expiryDate])
      return (
        <div className="space-y-1">
          <div className="font-mono text-sm">
            {formatDate(row.original.expiryDate, "dd.MM.yyyy")}
          </div>
          {expiryBadge}
        </div>
      )
    },
    enableSorting: true,
  },

  {
    id: "actions",
    header: () => (
      <StaticHeader>{translateMessage("generated.m0900")}</StaticHeader>
    ),
    cell: ({ row }) => {
      const item = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={translateMessage("generated.m0227")}>
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
              {translateMessage("generated.m0088")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Edit", item.id)}>
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilIcon} />
              {translateMessage("generated.m0934")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log("Show QR", item.qrCode)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={QrCodeIcon} />
              {translateMessage("generated.m0460")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => console.log("Delete", item.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
              {translateMessage("generated.m0230")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
  },
]
