"use client"

import { SquareIcon, ThermometerIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RackParametersCardProps {
  maxElementSize: { width: number; height: number; depth: number }
  tempRange: { min: number; max: number }
  gridDimensions: { rows: number; cols: number }
}

export function RackParametersCard({
  maxElementSize,
  tempRange,
  gridDimensions,
}: RackParametersCardProps) {
  const t = useTranslations("rackVisualization")
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide">
          {t("parameters.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <HugeiconsIcon
            className="size-5 self-center text-muted-foreground"
            icon={SquareIcon}
          />
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">
              {t("parameters.maxElement")}
            </p>
            <p className="font-medium text-sm">
              {t("parameters.maxElementValue", {
                width: maxElementSize.width,
                height: maxElementSize.height,
                depth: maxElementSize.depth,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <HugeiconsIcon
            className="size-5 self-center text-muted-foreground"
            icon={ThermometerIcon}
          />
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">
              {t("parameters.temperatureRange")}
            </p>
            <p className="font-medium text-sm">
              {t("parameters.temperatureValue", {
                min: tempRange.min,
                max: tempRange.max,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <HugeiconsIcon
            className="size-5 self-center text-muted-foreground"
            icon={SquareIcon}
          />
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">
              {t("parameters.gridDimensions")}
            </p>
            <p className="font-medium text-sm">
              {t("parameters.gridValue", {
                rows: gridDimensions.rows,
                cols: gridDimensions.cols,
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
