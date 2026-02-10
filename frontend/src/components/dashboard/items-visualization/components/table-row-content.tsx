"use client"

import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCell } from "@/components/ui/table"
import { translateMessage } from "@/i18n/translate-message"
import type { RackAssortment } from "@/lib/schemas"
import { cn } from "@/lib/utils"

interface TableRowContentProps {
  assortment: RackAssortment
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

function formatDateTime(dateString: string, locale: string) {
  return new Date(dateString).toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date()
}

export function TableRowContent({
  assortment,
  onView,
  onEdit,
  onDelete,
}: TableRowContentProps) {
  const locale = useLocale()
  const expired = isExpired(assortment.expiresAt)

  return (
    <>
      <TableCell className="font-mono text-sm">{assortment.code}</TableCell>
      <TableCell>{assortment.item.id}</TableCell>
      <TableCell className="text-sm">
        ({assortment.positionX}, {assortment.positionY})
      </TableCell>
      <TableCell>{assortment.userId}</TableCell>
      <TableCell className="text-sm">
        {formatDateTime(assortment.createdAt, locale)}
      </TableCell>
      <TableCell>
        <span className={expired ? "font-medium text-destructive" : ""}>
          {formatDateTime(assortment.expiresAt, locale)}
        </span>
        {expired && (
          <Badge className="ml-2" variant="destructive">
            {translateMessage("generated.m0482")}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={translateMessage("generated.m0227")}>
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
              onClick={() => onView(assortment.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={ViewIcon} />
              <span>{translateMessage("generated.m0483")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onEdit(assortment.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilEdit01Icon} />
              <span>{translateMessage("generated.m0934")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onDelete(assortment.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={Delete02Icon} />
              <span>{translateMessage("generated.m0230")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </>
  )
}
