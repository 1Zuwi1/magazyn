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

function getDaysUntilExpiryBadge(days: number | undefined) {
  if (days === undefined) {
    return <Badge variant="outline">Brak danych</Badge>
  }
  if (days < 0) {
    return <Badge variant="destructive">Przeterminowane!</Badge>
  }
  if (days < 14) {
    return <Badge variant="warning">za {days} dni</Badge>
  }
  return <Badge variant="outline">{days} dni</Badge>
}

export const itemsColumns: ColumnDef<ItemStats>[] = [
  {
    accessorKey: "definition.name",
    header: "Nazwa",
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
    header: "Kategoria",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original.definition.category}</Badge>
    ),
  },
  {
    accessorKey: "totalQuantity",
    header: "Ilość",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.totalQuantity} szt.</div>
    ),
  },
  {
    accessorKey: "daysUntilExpiry",
    header: "Okres przydatności",
    cell: ({ row }) => getDaysUntilExpiryBadge(row.original.daysUntilExpiry),
  },
  {
    accessorKey: "definition.isDangerous",
    header: "Niebezpieczeństwo",
    cell: ({ row }) =>
      row.original.definition.isDangerous ? (
        <Badge variant="destructive">Niebezpieczny</Badge>
      ) : (
        <Badge variant="outline">Bezpieczny</Badge>
      ),
  },
  {
    id: "actions",
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
  },
]
