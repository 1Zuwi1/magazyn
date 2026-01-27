import { useEffect, useState } from "react"
import { toast } from "sonner"
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
import { useCountdown } from "./use-countdown"
import {
  createPasswordChallenge,
  formatCountdown,
  sendVerificationCode,
  verifyOneTimeCode,
} from "./utils"

interface PasswordVerificationSectionProps {
  method: TwoFactorMethod
  onVerificationChange: (complete: boolean) => void
}

interface PasswordVerificationFlowHandlers {
  method: TwoFactorMethod
  onStageChange: (stage: PasswordVerificationStage) => void
  onErrorChange: (error: string) => void
  onResendCooldownChange: (cooldown: number) => void
  onChallengeChange: (challenge: PasswordChallenge | null) => void
}

interface PasswordVerificationState {
  stage: PasswordVerificationStage
  code: string
  error: string
  challenge: PasswordChallenge | null
}

function usePasswordVerificationFlow({
  method,
  onStageChange,
  onErrorChange,
  onResendCooldownChange,
  onChallengeChange,
}: PasswordVerificationFlowHandlers) {
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
      const message = "Nie udało się wysłać kodu. Spróbuj ponownie."
      onErrorChange(message)
      toast.error(message)
    }
  }

  const verifyCode = async (inputCode: string): Promise<void> => {
    if (inputCode.length !== OTP_LENGTH) {
      const message = "Wpisz pełny kod weryfikacyjny."
      onErrorChange(message)
      toast.error(message)
      return
    }

    onStageChange("verifying")
    onErrorChange("")

    try {
      const isValid = await verifyOneTimeCode(inputCode)

      if (isValid) {
        onStageChange("verified")
        return
      }

      onStageChange("error")
      const message = "Kod jest nieprawidłowy. Spróbuj ponownie."
      onErrorChange(message)
      toast.error(message)
    } catch {
      onStageChange("error")
      const message = "Wystąpił błąd podczas weryfikacji. Spróbuj ponownie."
      onErrorChange(message)
      toast.error(message)
    }
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
  method,
  onVerificationChange,
}: PasswordVerificationSectionProps) {
  const [state, setState] = useState<PasswordVerificationState>({
    stage: "idle",
    code: "",
    error: "",
    challenge: null,
  })
  const [resendCooldown, setResendCooldown] = useCountdown(0)
  const { stage, code, error, challenge } = state
  const complete = stage === "verified"
  const isBusy = stage === "sending" || stage === "verifying"
  const canResendCode = resendCooldown === 0 && !isBusy
  const canShowCodeInput =
    method === "authenticator" ||
    stage === "awaiting" ||
    stage === "verifying" ||
    stage === "error"

  useEffect(() => {
    if (!method) {
      return
    }

    setState({
      stage: "idle",
      code: "",
      error: "",
      challenge: null,
    })
    setResendCooldown(0)
  }, [method, setResendCooldown])

  useEffect(() => {
    onVerificationChange(complete)
  }, [complete, onVerificationChange])

  const { requestCode, verifyCode } = usePasswordVerificationFlow({
    method,
    onStageChange: (nextStage) =>
      setState((current) => ({ ...current, stage: nextStage })),
    onErrorChange: (nextError) =>
      setState((current) => ({ ...current, error: nextError })),
    onResendCooldownChange: setResendCooldown,
    onChallengeChange: (nextChallenge) =>
      setState((current) => ({ ...current, challenge: nextChallenge })),
  })

  const handleStartVerification = (): void => {
    if (method === "authenticator") {
      setState((current) => ({ ...current, stage: "awaiting" }))
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
              onCodeChange={(nextCode) =>
                setState((current) => ({ ...current, code: nextCode }))
              }
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
