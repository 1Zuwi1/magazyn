"use client"

import { useRouter } from "next/navigation"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLogout } from "@/hooks/use-session"
import { translateMessage } from "@/i18n/translate-message"

export function LogoutSection() {
  const router = useRouter()
  const logoutMutation = useLogout()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      router.replace("/login")
      router.refresh()
    } catch (error) {
      handleApiError(error, translateMessage("generated.m0516"))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translateMessage("generated.m0999")}</CardTitle>
        <p className="text-muted-foreground text-sm">
          {translateMessage("generated.m0517")}
        </p>
      </CardHeader>
      <CardContent>
        <Button
          isLoading={logoutMutation.isPending}
          onClick={handleLogout}
          type="button"
          variant="destructive"
        >
          {translateMessage("generated.m0518")}
        </Button>
      </CardContent>
    </Card>
  )
}
