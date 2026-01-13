import { CircleLock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function UnauthorizedComponent() {
  const t = await getTranslations("unauthorized")
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center">
            <HugeiconsIcon
              className="size-16 text-destructive"
              icon={CircleLock01Icon}
            />
          </div>
          <CardTitle className="mt-4 text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{t("details")}</p>
          <Link href="/dashboard">
            <Button className="w-full">{t("actions.backToDashboard")}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
