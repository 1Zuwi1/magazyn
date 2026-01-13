"use client"

import { Package } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useTranslations } from "next-intl"
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
import type { Warehouse } from "./types"

const FULL_WAREHOUSE_THRESHOLD = 90

interface WarehouseGridProps {
  warehouses: Warehouse[]
}

const getOccupancyPercentage = (used: number, capacity: number): number => {
  return capacity > 0 ? (used / capacity) * 100 : 0
}

export function WarehouseGrid({ warehouses }: WarehouseGridProps) {
  const t = useTranslations("dashboard.warehouseGrid")
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {warehouses.length === 0 && (
        <p className="col-span-full text-center text-muted-foreground">
          {t("empty")}
        </p>
      )}
      {warehouses.map((warehouse) => {
        const occupancyPercentage = getOccupancyPercentage(
          warehouse.used,
          warehouse.capacity
        )

        return (
          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            key={warehouse.id}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{warehouse.name}</CardTitle>
                  <CardDescription className="mt-1 flex items-center" />
                </div>
                <Badge
                  variant={
                    occupancyPercentage > FULL_WAREHOUSE_THRESHOLD
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {t("badge", {
                    percent: Math.round(occupancyPercentage),
                  })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("occupancy")}
                    </span>
                    <span className="font-medium">
                      {t("capacity", {
                        used: warehouse.used,
                        total: warehouse.capacity,
                      })}
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
                    {t("racks", { count: warehouse.racks.length })}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="grid gap-2 2xl:grid-cols-2">
              <Link
                className={buttonVariants({
                  variant: "outline",
                })}
                href={`/dashboard/warehouse/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}`}
              >
                {t("actions.viewRacks")}
              </Link>
              <Link
                className={buttonVariants({
                  variant: "outline",
                })}
                href={`/dashboard/warehouse/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}/3d-visualization`}
              >
                {t("actions.view3d")}
              </Link>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
