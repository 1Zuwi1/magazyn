import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { OTP_LENGTH, RESEND_COOLDOWN_SECONDS } from "./constants"
import { OtpInput } from "./otp-input"
import type {
  PasswordChallenge,
  PasswordVerificationStage,
  TwoFactorMethod,
} from "./types"
import {
  createPasswordChallenge,
  formatCountdown,
  sendVerificationCode,
  verifyOneTimeCode,
} from "./utils"

interface PasswordVerificationSectionProps {
  required: boolean
  complete: boolean
  method: TwoFactorMethod
  stage: PasswordVerificationStage
  code: string
  error: string
  resendCooldown: number
  challenge: PasswordChallenge | null
  onStageChange: (stage: PasswordVerificationStage) => void
  onCodeChange: (code: string) => void
  onErrorChange: (error: string) => void
  onResendCooldownChange: (cooldown: number) => void
  onChallengeChange: (challenge: PasswordChallenge | null) => void
}

function usePasswordVerificationFlow({
  method,
  onStageChange,
  onErrorChange,
  onResendCooldownChange,
  onChallengeChange,
}: Pick<
  PasswordVerificationSectionProps,
  | "method"
  | "onStageChange"
  | "onErrorChange"
  | "onResendCooldownChange"
  | "onChallengeChange"
>) {
  const requestCode = async (): Promise<void> => {
    onStageChange("sending")
    onErrorChange("")

    try {
      const newChallenge = await createPasswordChallenge(method)
      onChallengeChange(newChallenge)
      await sendVerificationCode(newChallenge.sessionId)
      onStageChange("awaiting")
      onResendCooldownChange(RESEND_COOLDOWN_SECONDS)
    } catch {
      onStageChange("error")
      onErrorChange("Nie udało się wysłać kodu. Spróbuj ponownie.")
    }
  }

  const verifyCode = async (inputCode: string): Promise<void> => {
    if (inputCode.length !== OTP_LENGTH) {
      onErrorChange("Wpisz pełny kod weryfikacyjny.")
      return
    }

    onStageChange("verifying")
    onErrorChange("")

    const isValid = await verifyOneTimeCode(inputCode)

    if (isValid) {
      onStageChange("verified")
      return
    }

    onStageChange("error")
    onErrorChange("Kod jest nieprawidłowy. Spróbuj ponownie.")
  }

  return { requestCode, verifyCode }
}

function PasswordVerificationAlerts({
  challenge,
  error,
}: {
  challenge: PasswordChallenge | null
  error: string
}) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Nie udało się zweryfikować</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <Spinner className="text-muted-foreground" />
      <AlertTitle>Wysyłamy kod</AlertTitle>
      <AlertDescription>
        Kod trafia na {challenge?.destination ?? "wybraną metodę"}.
      </AlertDescription>
    </Alert>
  )
}

function CodeInputEntry({
  method,
  code,
  resendCooldown,
  isBusy,
  canResend,
  onCodeChange,
  onResend,
  onVerify,
}: {
  method: TwoFactorMethod
  code: string
  resendCooldown: number
  isBusy: boolean
  canResend: boolean
  onCodeChange: (code: string) => void
  onResend: () => void
  onVerify: () => void
}) {
  return (
    <div className="space-y-3">
      <Label htmlFor="password-2fa-code">Kod 2FA</Label>
      <OtpInput id="password-2fa-code" onChange={onCodeChange} value={code} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={code.length !== OTP_LENGTH}
          isLoading={isBusy}
          onClick={onVerify}
          type="button"
        >
          Zweryfikuj kod
        </Button>
        {method !== "authenticator" ? (
          <Button
            disabled={!canResend}
            onClick={onResend}
            type="button"
            variant="outline"
          >
            {resendCooldown > 0
              ? `Wyślij ponownie (${formatCountdown(resendCooldown)})`
              : "Wyślij ponownie"}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function PasswordVerificationSection({
  required,
  complete,
  method,
  stage,
  code,
  error,
  resendCooldown,
  challenge,
  onStageChange,
  onCodeChange,
  onErrorChange,
  onResendCooldownChange,
  onChallengeChange,
}: PasswordVerificationSectionProps) {
  const isBusy = stage === "sending" || stage === "verifying"
  const canResendCode = resendCooldown === 0 && !isBusy
  const canShowCodeInput =
    method === "authenticator" ||
    stage === "awaiting" ||
    stage === "verifying" ||
    stage === "error"

  const { requestCode, verifyCode } = usePasswordVerificationFlow({
    method,
    onStageChange,
    onErrorChange,
    onResendCooldownChange,
    onChallengeChange,
  })

  const handleStartVerification = (): void => {
    if (!required) {
      return
    }

    if (method === "authenticator") {
      onStageChange("awaiting")
      return
    }

    requestCode()
  }

  const handleResendCode = (): void => {
    if (method === "authenticator") {
      return
    }

    requestCode()
  }

  const handleVerifyCode = (): void => {
    verifyCode(code)
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold text-sm">Potwierdź 2FA przed zmianą</p>
          <p className="text-muted-foreground text-sm">
            {method === "authenticator"
              ? "Wpisz kod z aplikacji uwierzytelniającej."
              : `Wyślemy kod na ${challenge?.destination ?? "wybraną metodę"}.`}
          </p>
        </div>
        <Badge variant={complete ? "success" : "warning"}>
          {complete ? "Zweryfikowano" : "Wymagane"}
        </Badge>
      </div>

      {complete ? (
        <Alert>
          <AlertTitle>Zweryfikowano</AlertTitle>
          <AlertDescription>Możesz bezpiecznie zmienić hasło.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {method !== "authenticator" && stage === "idle" ? (
            <Button
              isLoading={false}
              onClick={handleStartVerification}
              type="button"
              variant="outline"
            >
              Wyślij kod
            </Button>
          ) : null}

          <PasswordVerificationAlerts challenge={challenge} error={error} />

          {canShowCodeInput ? (
            <CodeInputEntry
              canResend={canResendCode}
              code={code}
              isBusy={isBusy}
              method={method}
              onCodeChange={onCodeChange}
              onResend={handleResendCode}
              onVerify={handleVerifyCode}
              resendCooldown={resendCooldown}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
