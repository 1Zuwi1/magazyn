"use client"

import { useRouter } from "next/navigation"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLogout } from "@/hooks/use-session"

export function LogoutSection() {
  const router = useRouter()
  const logoutMutation = useLogout()

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      router.replace("/login")
      router.refresh()
    } catch (error) {
      handleApiError(error, "Nie udało się wylogować. Spróbuj ponownie.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wylogowanie</CardTitle>
        <p className="text-muted-foreground text-sm">
          Zakończ bieżącą sesję i wróć do ekranu logowania.
        </p>
      </CardHeader>
      <CardContent>
        <Button
          isLoading={logoutMutation.isPending}
          onClick={handleLogout}
          type="button"
          variant="destructive"
        >
          Wyloguj się
        </Button>
      </CardContent>
    </Card>
  )
}
