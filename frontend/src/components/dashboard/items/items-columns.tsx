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
import { ExpiryBadge } from "./components/expiry-badge"
import { SortableHeader, StaticHeader } from "./sortable-header"
import type { ItemStats } from "./types"

export const itemsColumns: ColumnDef<ItemStats>[] = [
  {
    accessorKey: "definition.name",
    header: ({ column }) => (
      <SortableHeader column={column}>Nazwa</SortableHeader>
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
      <SortableHeader column={column}>Kategoria</SortableHeader>
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.definition.category}</Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "totalQuantity",
    header: ({ column }) => (
      <SortableHeader column={column}>Ilość</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="font-medium font-mono">
        {row.original.totalQuantity} szt.
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "daysUntilExpiry",
    header: "Okres przydatności",
    cell: ({ row }) => {
      const { nearestExpiryDate, daysUntilExpiry } = row.original
      if (nearestExpiryDate) {
        return <ExpiryBadge expiryDate={nearestExpiryDate} />
      }
      if (typeof daysUntilExpiry === "number") {
        return <Badge variant="secondary">{daysUntilExpiry} dni</Badge>
      }
      return <Badge variant="outline">Brak daty</Badge>
    },
  },
  {
    accessorKey: "definition.isDangerous",
    header: ({ column }) => (
      <SortableHeader column={column}>Niebezpieczeństwo</SortableHeader>
    ),
    cell: ({ row }) =>
      row.original.definition.isDangerous ? (
        <Badge variant="destructive">Niebezpieczny</Badge>
      ) : (
        <Badge variant="outline">Bezpieczny</Badge>
      ),
    enableSorting: true,
  },
  {
    id: "actions",
    header: () => <StaticHeader>Akcje</StaticHeader>,
    cell: ({ row }) => {
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
            <DropdownMenuItem
              onClick={() => {
                console.log("Edit definition", row.original.definitionId)
              }}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilIcon} />
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                console.log("Delete definition", row.original.definitionId)
              }}
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
