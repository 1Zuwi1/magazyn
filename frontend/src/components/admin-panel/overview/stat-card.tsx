import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: number
  description?: string
  icon: IconSvgElement
  href: string
  variant?: "default" | "warning"
}

export function StatCard({
  title,
  value,
  description,
  icon,
  href,
  variant = "default",
}: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-medium text-sm">{title}</CardTitle>
          <HugeiconsIcon
            className={
              variant === "warning"
                ? "h-5 w-5 text-orange-500"
                : "h-5 w-5 text-muted-foreground"
            }
            icon={icon}
          />
        </CardHeader>
        <CardContent>
          <div
            className={
              variant === "warning"
                ? "font-bold text-3xl text-orange-500"
                : "font-bold text-3xl"
            }
          >
            {value}
          </div>
          <p className="min-h-4 text-muted-foreground text-xs">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
