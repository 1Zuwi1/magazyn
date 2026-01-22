"use client"

import {
  Delete02Icon,
  MoreHorizontalCircle01FreeIcons,
  Package,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import type { Warehouse } from "@/components/dashboard/types"
import { pluralize } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const FULL_WAREHOUSE_THRESHOLD = 90

interface WarehouseGridProps {
  warehouses: Warehouse[]
  onEdit?: (warehouse: Warehouse) => void
  onDelete?: (warehouse: Warehouse) => void
}

const getOccupancyPercentage = (used: number, capacity: number): number => {
  return capacity > 0 ? (used / capacity) * 100 : 0
}

export function WarehouseGrid({
  warehouses,
  onEdit,
  onDelete,
}: WarehouseGridProps) {
  const actions = onEdit || onDelete

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {warehouses.length === 0 && (
        <p className="col-span-full text-center text-muted-foreground">
          Brak magazynów do wyświetlenia.
        </p>
      )}
      {warehouses.map((warehouse) => {
        const occupancyPercentage = getOccupancyPercentage(
          warehouse.used,
          warehouse.capacity
        )

        return (
          <Card
            className="transition-shadow hover:shadow-lg"
            key={warehouse.id}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{warehouse.name}</CardTitle>
                  <CardDescription className="mt-1">
                    ID: {warehouse.id}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      occupancyPercentage > FULL_WAREHOUSE_THRESHOLD
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {Math.round(occupancyPercentage)}% Pełny
                  </Badge>
                  {actions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger aria-label="Akcje magazynu">
                        <HugeiconsIcon icon={MoreHorizontalCircle01FreeIcons} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {onEdit && (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => onEdit(warehouse)}
                          >
                            <HugeiconsIcon
                              className="mr-2 h-4 w-4"
                              icon={PencilEdit01Icon}
                            />
                            Edytuj
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => onDelete(warehouse)}
                          >
                            <HugeiconsIcon
                              className="mr-2 h-4 w-4"
                              icon={Delete02Icon}
                            />
                            Usuń
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Zapełnienie</span>
                    <span className="font-medium">
                      {warehouse.used} / {warehouse.capacity}{" "}
                      {pluralize(
                        warehouse.capacity,
                        "miejsce",
                        "miejsca",
                        "miejsc"
                      )}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${occupancyPercentage > FULL_WAREHOUSE_THRESHOLD ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${occupancyPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <HugeiconsIcon className="mr-2 h-4 w-4" icon={Package} />
                    {warehouse.racks.length}{" "}
                    {pluralize(
                      warehouse.racks.length,
                      "Regał",
                      "Regały",
                      "Regałów"
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
                href={`/dashboard/admin/warehouses/${encodeURIComponent(warehouse.name)}`}
              >
                Zarządzaj regałami
              </Link>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
