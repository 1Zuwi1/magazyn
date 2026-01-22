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

interface PasswordSectionProps {
  verificationRequired: boolean
  verificationComplete: boolean
  verificationBlocked: boolean
  passwordNote: string
  onPasswordSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  twoFactorMethod: string
  verificationStage: import("./types").PasswordVerificationStage
  verificationCode: string
  verificationError: string
  resendCooldown: number
  challenge: import("./types").PasswordChallenge | null
  onStageChange: (stage: import("./types").PasswordVerificationStage) => void
  onCodeChange: (code: string) => void
  onErrorChange: (error: string) => void
  onResendCooldownChange: (cooldown: number) => void
  onChallengeChange: (
    challenge: import("./types").PasswordChallenge | null
  ) => void
}

export function PasswordSection({
  verificationRequired,
  verificationComplete,
  verificationBlocked,
  passwordNote,
  onPasswordSubmit,
  twoFactorMethod,
  verificationStage,
  verificationCode,
  verificationError,
  resendCooldown,
  challenge,
  onStageChange,
  onCodeChange,
  onErrorChange,
  onResendCooldownChange,
  onChallengeChange,
}: PasswordSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zmiana hasła</CardTitle>
        <p className="text-muted-foreground text-sm">
          Użyj silnego hasła, aby zabezpieczyć konto.
        </p>
      </CardHeader>
      <form onSubmit={onPasswordSubmit}>
        <CardContent className="space-y-4">
          {verificationRequired ? (
            <PasswordVerificationSection
              challenge={challenge}
              code={verificationCode}
              complete={verificationComplete}
              error={verificationError}
              method={twoFactorMethod as import("./types").TwoFactorMethod}
              onChallengeChange={onChallengeChange}
              onCodeChange={onCodeChange}
              onErrorChange={onErrorChange}
              onResendCooldownChange={onResendCooldownChange}
              onStageChange={onStageChange}
              required={verificationRequired}
              resendCooldown={resendCooldown}
              stage={verificationStage}
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
