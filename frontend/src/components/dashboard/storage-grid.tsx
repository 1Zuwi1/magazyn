"use client"

import {
  Alert01Icon,
  ArrowRight01Icon,
  CubeIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { translateMessage } from "@/i18n/translate-message"
import type { Warehouse } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { Badge } from "../ui/badge"
import { getOccupancyPercentage, pluralize } from "./utils/helpers"

const OCCUPANCY_WARNING_THRESHOLD = 75
const OCCUPANCY_CRITICAL_THRESHOLD = 90

interface WarehouseGridProps {
  warehouses: Warehouse[]
  isLoading?: boolean
}

const getOccupancyColor = (percentage: number): string => {
  if (percentage >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "bg-destructive"
  }
  if (percentage >= OCCUPANCY_WARNING_THRESHOLD) {
    return "bg-orange-500"
  }
  return "bg-primary"
}

const getOccupancyBadgeVariant = (
  percentage: number
): "destructive" | "warning" | "secondary" => {
  if (percentage >= OCCUPANCY_CRITICAL_THRESHOLD) {
    return "destructive"
  }
  if (percentage >= OCCUPANCY_WARNING_THRESHOLD) {
    return "warning"
  }
  return "secondary"
}
function WarehouseGridSkeleton() {
  return (
    <div className="grid @5xl:grid-cols-3 @xl:grid-cols-2 gap-4 sm:gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card
          className="relative overflow-hidden"
          key={index}
          style={{ animationDelay: `${index * 75}ms` }}
        >
          {/* Decorative shimmer overlay */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/5 to-transparent" />

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pb-4">
            {/* Occupancy Bar Skeleton */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>

            {/* Quick Stats Row Skeleton */}
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, statIndex) => (
                <div
                  className="rounded-md bg-muted/50 px-2 py-1.5 text-center"
                  key={statIndex}
                >
                  <Skeleton className="mx-auto mb-1 h-4 w-8" />
                  <Skeleton className="mx-auto h-2.5 w-10" />
                </div>
              ))}
            </div>
          </CardContent>

          <CardFooter className="gap-2 border-t pt-4">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 flex-1 rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export function WarehouseGrid({ warehouses, isLoading }: WarehouseGridProps) {
  const router = useRouter()
  const [visualizationTarget, setVisualizationTarget] = useState<{
    id: number
    name: string
  } | null>(null)

  if (isLoading) {
    return <WarehouseGridSkeleton />
  }
  if (warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="size-8 text-muted-foreground"
            icon={Layers01Icon}
          />
        </div>
        <p className="mt-4 font-medium text-muted-foreground">
          {translateMessage("generated.m0655")}
        </p>
        <p className="mt-1 text-muted-foreground text-sm">
          {translateMessage("generated.m0656")}
        </p>
      </div>
    )
  }

  return (
    <div className="grid @5xl:grid-cols-3 @xl:grid-cols-2 gap-4 sm:gap-6">
      {warehouses.map((warehouse) => {
        const occupancyPercentage = getOccupancyPercentage(
          warehouse.occupiedSlots,
          warehouse.occupiedSlots + warehouse.freeSlots
        )
        const roundedOccupancy = Math.round(occupancyPercentage)

        return (
          <Card
            className="group relative overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary/20"
            key={warehouse.id}
          >
            {/* Decorative corner accent */}
            <div
              className={cn(
                "absolute top-0 right-0 size-24 translate-x-12 -translate-y-12 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20",
                getOccupancyColor(occupancyPercentage)
              )}
            />

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10">
                    <span className="font-bold font-mono text-primary text-sm">
                      {warehouse.id}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                    <p className="mt-0.5 flex items-center gap-1 text-muted-foreground text-xs">
                      <HugeiconsIcon className="size-3" icon={Layers01Icon} />
                      {warehouse.racksCount}{" "}
                      {pluralize(
                        warehouse.racksCount,
                        translateMessage("generated.m0323"),
                        translateMessage("generated.m0324"),
                        translateMessage("generated.m0241")
                      )}
                    </p>
                  </div>
                </div>
                <Badge variant={getOccupancyBadgeVariant(occupancyPercentage)}>
                  {roundedOccupancy}%
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-4">
              {/* Occupancy Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {translateMessage("generated.m0322")}
                  </span>
                  <span className="font-medium font-mono">
                    {warehouse.occupiedSlots.toLocaleString("pl-PL")} /{" "}
                    {(
                      warehouse.occupiedSlots + warehouse.freeSlots
                    ).toLocaleString("pl-PL")}
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getOccupancyColor(occupancyPercentage)
                    )}
                    style={{ width: `${occupancyPercentage}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="block font-mono font-semibold text-sm">
                    {warehouse.occupiedSlots.toLocaleString("pl-PL")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {translateMessage("generated.m0409")}
                  </span>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="block font-mono font-semibold text-sm">
                    {warehouse.freeSlots.toLocaleString("pl-PL")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {translateMessage("generated.m0995")}
                  </span>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="block font-mono font-semibold text-sm">
                    {warehouse.racksCount}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {pluralize(
                      warehouse.racksCount,
                      translateMessage("generated.m0168"),
                      translateMessage("generated.m0383"),
                      translateMessage("generated.m0083")
                    )}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="gap-2 border-t pt-4">
              <Link
                className={buttonVariants({
                  variant: "default",
                  size: "sm",
                  className: "flex-1 gap-1.5",
                })}
                href={`/dashboard/warehouse/id/${warehouse.id}/${encodeURIComponent(warehouse.name)}`}
              >
                <span>{translateMessage("generated.m0383")}</span>
                <HugeiconsIcon className="size-3.5" icon={ArrowRight01Icon} />
              </Link>
              <Button
                className="flex-1 gap-1.5"
                onClick={() =>
                  setVisualizationTarget({
                    id: warehouse.id,
                    name: warehouse.name,
                  })
                }
                size="sm"
                variant="outline"
              >
                <HugeiconsIcon className="size-3.5" icon={CubeIcon} />
                <span>{translateMessage("generated.m1007")}</span>
              </Button>
            </CardFooter>
          </Card>
        )
      })}

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setVisualizationTarget(null)
          }
        }}
        open={visualizationTarget !== null}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-amber-500/10">
              <HugeiconsIcon
                className="text-amber-500"
                icon={Alert01Icon}
                size={24}
              />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {translateMessage("generated.m0098")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translateMessage("generated.m0099")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {translateMessage("generated.m0885")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (visualizationTarget) {
                  router.push(
                    `/dashboard/warehouse/id/${visualizationTarget.id}/${encodeURIComponent(visualizationTarget.name)}/3d-visualization`
                  )
                }
              }}
            >
              {translateMessage("generated.m0100")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
