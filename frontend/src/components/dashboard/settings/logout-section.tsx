"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLogout } from "@/hooks/use-session"
export function LogoutSection() {
  const t = useTranslations()

  const router = useRouter()
  const logoutMutation = useLogout()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      router.replace("/login")
      router.refresh()
    } catch (error) {
      handleApiError(
        error,
        t("generated.dashboard.settings.failedLogOutAgain"),
        t
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("generated.dashboard.settings.logout")}</CardTitle>
        <p className="text-muted-foreground text-sm">
          {t("generated.dashboard.settings.endCurrentSessionReturnLogin")}
        </p>
      </CardHeader>
      <CardContent>
        <Button
          isLoading={logoutMutation.isPending}
          onClick={handleLogout}
          type="button"
          variant="destructive"
        >
          {t("generated.dashboard.settings.logOut")}
        </Button>
      </CardContent>
    </Card>
  )
}
