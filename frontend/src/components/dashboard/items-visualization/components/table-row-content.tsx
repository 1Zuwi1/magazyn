"use client"

import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCell } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Item } from "../../types"
import { formatDate } from "../../utils/helpers"

interface TableRowContentProps {
  item: Item
  expired: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function formatDimensions(dimensions: {
  x: number
  y: number
  z: number
}): string {
  return `${dimensions.x}×${dimensions.y}×${dimensions.z} mm`
}

export function TableRowContent({
  item,
  expired,
  onView,
  onEdit,
  onDelete,
}: TableRowContentProps) {
  return (
    <>
      <TableCell>
        <div className="flex items-center justify-center">
          {item.imageUrl ? (
            <div className="relative h-10 w-10 overflow-hidden rounded">
              <Image
                alt={item.name}
                className="object-cover"
                fill
                sizes="40px"
                src={item.imageUrl}
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
              <span className="text-muted-foreground text-xs">-</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{item.name}</div>
          {item.comment && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <p className="line-clamp-1 text-muted-foreground text-xs">
                    {item.comment}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{item.comment}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{item.qrCode}</TableCell>
      <TableCell>{item.weight.toFixed(2)} kg</TableCell>
      <TableCell className="text-sm">
        {formatDimensions(item.dimensions)}
      </TableCell>
      <TableCell className="text-sm">
        {item.minTemp}°C – {item.maxTemp}°C
      </TableCell>
      <TableCell>
        <span className={expired ? "font-medium text-destructive" : ""}>
          {formatDate(item.expiryDate)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {item.isDangerous && (
            <Badge variant="destructive">Niebezpieczny</Badge>
          )}
          {expired && <Badge variant="secondary">Przeterminowany</Badge>}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Otwórz menu">
            <HugeiconsIcon
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  size: "icon",
                })
              )}
              icon={MoreVerticalIcon}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onView(item.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={ViewIcon} />
              <span>Podgląd</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onEdit(item.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilEdit01Icon} />
              <span>Edytuj</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={Delete02Icon} />
              <span>Usuń</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </>
  )
}
