"use client"

import type { ColumnDef } from "@tanstack/react-table"
import {
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react"
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
    return <Badge variant="destructive">Przeterminowany</Badge>
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
    header: "Status",
    cell: ({ row }) => getDaysUntilExpiryBadge(row.original.daysUntilExpiry),
  },
  {
    accessorKey: "definition.isDangerous",
    header: "Niebezpieczny",
    cell: ({ row }) =>
      row.original.definition.isDangerous ? (
        <Badge variant="destructive">Tak</Badge>
      ) : (
        <Badge variant="outline">Nie</Badge>
      ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <MoreHorizontalIcon
              className={cn(buttonVariants({ variant: "ghost" }))}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => console.log("View", item.definitionId)}
            >
              <EyeIcon className="mr-2 h-4 w-4" />
              Szczegóły
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => console.log("Edit", item.definitionId)}
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => console.log("Delete", item.definitionId)}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
