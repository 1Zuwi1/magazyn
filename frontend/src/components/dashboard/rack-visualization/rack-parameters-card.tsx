import {
  GridViewIcon,
  RulerIcon,
  Settings01Icon,
  ThermometerIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { translateMessage } from "@/i18n/translate-message"

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
  const parameters = [
    {
      icon: RulerIcon,
      label: translateMessage("generated.m0501"),
      value: `${maxElementSize.width} × ${maxElementSize.height} × ${maxElementSize.depth}`,
      unit: "mm",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: ThermometerIcon,
      label: translateMessage("generated.m0502"),
      value: `${tempRange.min}°C – ${tempRange.max}°C`,
      unit: null,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: GridViewIcon,
      label: translateMessage("generated.m0503"),
      value: `${gridDimensions.rows} × ${gridDimensions.cols}`,
      unit: "miejsc",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <HugeiconsIcon
            className="size-4 text-primary"
            icon={Settings01Icon}
          />
        </div>
        <h3 className="font-semibold text-sm">
          {translateMessage("generated.m0504")}
        </h3>
      </div>

      {/* Parameters List */}
      <div className="divide-y">
        {parameters.map((param) => (
          <div
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20"
            key={param.label}
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${param.bgColor}`}
            >
              <HugeiconsIcon
                className={`size-5 ${param.color}`}
                icon={param.icon}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs">{param.label}</p>
              <p className="font-mono font-semibold text-sm">
                {param.value}
                {param.unit && (
                  <span className="ml-1 font-normal text-muted-foreground text-xs">
                    {param.unit}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
