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
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { formatDate, getDaysUntilExpiry } from "../utils/helpers"
import { SortableHeader, StaticHeader } from "./sortable-header"
import type { ItemInstance } from "./types"

function getExpiryBadge(expiryDate: Date) {
  const days = getDaysUntilExpiry(new Date(), expiryDate)

  if (days < 0) {
    return (
      <Badge variant="destructive">
        Przeterminowany ({Math.abs(days)} dni temu)
      </Badge>
    )
  }

  if (days === 0) {
    return <Badge variant="destructive">Dzisiaj</Badge>
  }

  if (days <= 3) {
    return <Badge variant="destructive">{days} dni</Badge>
  }

  if (days <= 7) {
    return (
      <Badge className="bg-orange-500" variant="default">
        {days} dni
      </Badge>
    )
  }

  if (days <= 14) {
    return (
      <Badge className="bg-yellow-500" variant="default">
        {days} dni
      </Badge>
    )
  }

  return <Badge variant="outline">{days} dni</Badge>
}

export const assortmentColumns: ColumnDef<ItemInstance>[] = [
  {
    id: "category",
    accessorKey: "definition.category",
    header: ({ column }) => (
      <SortableHeader column={column}>Kategoria</SortableHeader>
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
      <SortableHeader column={column}>Nazwa przedmiotu</SortableHeader>
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
      <SortableHeader column={column}>Regał</SortableHeader>
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.rackName}</div>
        <div className="text-muted-foreground text-sm">
          Rząd {row.original.position.row + 1}, Kol.{" "}
          {row.original.position.col + 1}
        </div>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "qrCode",
    header: ({ column }) => (
      <SortableHeader column={column}>QR Code</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          className="h-4 w-4 text-muted-foreground"
          icon={QrCodeIcon}
        />
        <span className="font-mono text-sm">{row.original.qrCode}</span>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "addedDate",
    header: ({ column }) => (
      <SortableHeader column={column}>Data dodania</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {formatDate(row.original.addedDate)}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "expiryDate",
    header: ({ column }) => (
      <SortableHeader column={column}>Przeterminowanie</SortableHeader>
    ),
    cell: ({ row }) => {
      const expiryBadge = useMemo(() => {
        return getExpiryBadge(row.original.expiryDate)
      }, [row.original.expiryDate])
      return (
        <div className="space-y-1">
          <div className="font-mono text-sm">
            {formatDate(row.original.expiryDate)}
          </div>
          {expiryBadge}
        </div>
      )
    },
    enableSorting: true,
  },

  {
    id: "actions",
    header: () => <StaticHeader>Akcje</StaticHeader>,
    cell: ({ row }) => {
      const item = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Otwórz menu">
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
              Szczegóły
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log("Edit", item.id)}>
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilIcon} />
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log("Show QR", item.qrCode)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={QrCodeIcon} />
              Pokaż QR
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => console.log("Delete", item.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={Trash} />
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
  },
]
