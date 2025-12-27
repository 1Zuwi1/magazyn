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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Item } from "../../types"

interface RackItemsTableProps {
  items: NonNullable<Item>[]
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function isExpired(date: Date): boolean {
  return date < new Date()
}

function formatDimensions(dimensions: {
  x: number
  y: number
  z: number
}): string {
  return `${dimensions.x}×${dimensions.y}×${dimensions.z} mm`
}

export function RackItemsTable({ items }: RackItemsTableProps) {
  const handleView = (itemId: string) => {
    console.log("View item:", itemId)
  }

  const handleEdit = (itemId: string) => {
    console.log("Edit item:", itemId)
  }

  const handleDelete = (itemId: string) => {
    console.log("Delete item:", itemId)
  }

  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Brak przedmiotów w tym regale</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-100 rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Zdjęcie</TableHead>
            <TableHead className="min-w-37.5">Nazwa</TableHead>
            {/* Todo: Zrobić preview kodu qr po kliknięciu później */}
            <TableHead className="w-25">Kod QR</TableHead>
            <TableHead className="w-20">Waga</TableHead>
            <TableHead className="w-25">Wymiary</TableHead>
            <TableHead className="w-20">Temp.</TableHead>
            <TableHead className="w-25">Data ważności</TableHead>
            <TableHead className="w-25 text-center">Status</TableHead>
            <TableHead className="w-16"> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const expired = isExpired(item.expiryDate)
            return (
              <TableRow key={item.id}>
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
                <TableCell className="font-mono text-sm">
                  {item.qrCode}
                </TableCell>
                <TableCell>{item.weight.toFixed(2)} kg</TableCell>
                <TableCell className="text-sm">
                  {formatDimensions(item.dimensions)}
                </TableCell>
                <TableCell className="text-sm">
                  {item.minTemp}°C – {item.maxTemp}°C
                </TableCell>
                <TableCell>
                  <span
                    className={expired ? "font-medium text-destructive" : ""}
                  >
                    {formatDate(item.expiryDate)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.isDangerous && (
                      <Badge variant="destructive">Niebezpieczny</Badge>
                    )}
                    {expired && (
                      <Badge variant="secondary">Przeterminowany</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
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
                        onClick={() => handleView(item.id)}
                      >
                        <HugeiconsIcon
                          className="mr-2 h-4 w-4"
                          icon={ViewIcon}
                        />
                        <span>Podgląd</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => handleEdit(item.id)}
                      >
                        <HugeiconsIcon
                          className="mr-2 h-4 w-4"
                          icon={PencilEdit01Icon}
                        />
                        <span>Edytuj</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <HugeiconsIcon
                          className="mr-2 h-4 w-4"
                          icon={Delete02Icon}
                        />
                        <span>Usuń</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
