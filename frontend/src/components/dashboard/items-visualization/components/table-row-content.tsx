"use client"

import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCell } from "@/components/ui/table"
import type { RackAssortment } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { formatDateTime } from "../../utils/helpers"

interface TableRowContentProps {
  assortment: RackAssortment
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
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
  const t = useTranslations()

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
            {t("generated.shared.expired")}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={t("generated.shared.openMenu")}>
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
              <span>{t("generated.dashboard.itemsVisualization.preview")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onEdit(assortment.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={PencilEdit01Icon} />
              <span>{t("generated.shared.edit")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onDelete(assortment.id)}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={Delete02Icon} />
              <span>{t("generated.shared.remove")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </>
  )
}
