import { CircleLock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function UnauthorizedComponent() {
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
          <CardTitle className="mt-4 text-2xl">Brak dostępu</CardTitle>
          <CardDescription>
            Nie masz uprawnień do wyświetlenia tej strony.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Ta strona wymaga specjalnych uprawnień. Jeśli uważasz, że to błąd,
            skontaktuj się z administratorem.
          </p>
          <Link href="/dashboard">
            <Button className="w-full">Wróć do panelu głównego</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
