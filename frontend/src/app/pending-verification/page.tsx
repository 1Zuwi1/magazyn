import { Clock01Icon } from "@hugeicons/core-free-icons"
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

export default function PendingVerificationPage() {
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
          <CardTitle className="mt-4 text-2xl">
            Oczekiwanie na weryfikację
          </CardTitle>
          <CardDescription>
            Twoje konto oczekuje na akceptację przez administratora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Twoja rejestracja została przyjęta i oczekuje na weryfikację przez
            administratora. Zostaniesz powiadomiony, gdy Twoje konto zostanie
            aktywowane. Prosimy o cierpliwość.
          </p>
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm">
              <span className="font-semibold">Co teraz?</span>
            </p>
            <ul className="mt-2 list-inside list-disc text-left text-muted-foreground text-sm">
              <li>Oczekuj na wiadomość e-mail z potwierdzeniem</li>
              <li>Sprawdzaj swoją skrzynkę odbiorczą regularnie</li>
              <li>
                Skontaktuj się z administratorem, jeśli to potrwa dłużej niż 24h
              </li>
            </ul>
          </div>
          <Link href="/login">
            <Button className="w-full" variant="outline">
              Wróć do strony logowania
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
