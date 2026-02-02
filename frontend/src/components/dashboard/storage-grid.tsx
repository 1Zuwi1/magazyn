import { Package } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
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
import { getOccupancyPercentage, pluralize } from "./utils/helpers"

const FULL_WAREHOUSE_THRESHOLD = 90

interface WarehouseGridProps {
  warehouses: Warehouse[]
}

export function WarehouseGrid({ warehouses }: WarehouseGridProps) {
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
                  {Math.round(occupancyPercentage)}% Pełny
                </Badge>
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
            <CardFooter className="grid gap-2 2xl:grid-cols-2">
              <Link
                className={buttonVariants({
                  variant: "outline",
                })}
                href={`/dashboard/warehouse/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}`}
              >
                Zobacz Regały
              </Link>
              <Link
                className={buttonVariants({
                  variant: "outline",
                })}
                href={`/dashboard/warehouse/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}/3d-visualization`}
              >
                Zobacz Wizualizację 3D
              </Link>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
