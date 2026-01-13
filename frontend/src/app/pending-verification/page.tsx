import { Clock01Icon } from "@hugeicons/core-free-icons"
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

export default async function PendingVerificationPage() {
  const t = await getTranslations("pendingVerification")
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center">
            <HugeiconsIcon
              className="size-16 text-amber-500"
              icon={Clock01Icon}
            />
          </div>
          <CardTitle className="mt-4 text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{t("details")}</p>
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm">
              <span className="font-semibold">{t("nextSteps.title")}</span>
            </p>
            <ul className="mt-2 list-inside list-disc text-left text-muted-foreground text-sm">
              <li>{t("nextSteps.items.confirmation")}</li>
              <li>{t("nextSteps.items.inbox")}</li>
              <li>{t("nextSteps.items.contact")}</li>
            </ul>
          </div>
          <Link href="/login">
            <Button className="w-full" variant="outline">
              {t("actions.backToLogin")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
