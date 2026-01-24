import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordVerificationSection } from "./password-verification-section"
import type { TwoFactorMethod } from "./types"

interface PasswordSectionProps {
  verificationRequired: boolean
  twoFactorMethod: TwoFactorMethod
}

export function PasswordSection({
  verificationRequired,
  twoFactorMethod,
}: PasswordSectionProps) {
  const [passwordNote, setPasswordNote] = useState<string>("")
  const [verificationComplete, setVerificationComplete] =
    useState<boolean>(false)

  const verificationBlocked = verificationRequired && !verificationComplete

  const handlePasswordSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ): void => {
    event.preventDefault()
    if (verificationBlocked) {
      setPasswordNote("Najpierw potwierdź 2FA, aby zmienić hasło.")
      return
    }
    setPasswordNote("Hasło zaktualizowane lokalnie (mock).")
  }

  useEffect(() => {
    if (!verificationRequired) {
      setVerificationComplete(false)
      setPasswordNote("")
    }
  }, [verificationRequired])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zmiana hasła</CardTitle>
        <p className="text-muted-foreground text-sm">
          Użyj silnego hasła, aby zabezpieczyć konto.
        </p>
      </CardHeader>
      <form onSubmit={handlePasswordSubmit}>
        <CardContent className="space-y-4">
          {verificationRequired ? (
            <PasswordVerificationSection
              method={twoFactorMethod}
              onVerificationChange={setVerificationComplete}
            />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="current-password">Obecne hasło</Label>
            <Input
              autoComplete="current-password"
              disabled={verificationBlocked}
              id="current-password"
              placeholder="Wprowadź obecne hasło"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nowe hasło</Label>
            <Input
              autoComplete="new-password"
              disabled={verificationBlocked}
              id="new-password"
              placeholder="Co najmniej 8 znaków"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Potwierdź hasło</Label>
            <Input
              autoComplete="new-password"
              disabled={verificationBlocked}
              id="confirm-password"
              placeholder="Powtórz nowe hasło"
              type="password"
            />
          </div>
          <p className="text-muted-foreground text-sm">
            Użyj min. 8 znaków, w tym cyfr i znaków specjalnych.
          </p>
          {passwordNote ? (
            <p className="text-muted-foreground text-sm">{passwordNote}</p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end">
          <Button disabled={verificationBlocked} type="submit">
            Zmień hasło
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
