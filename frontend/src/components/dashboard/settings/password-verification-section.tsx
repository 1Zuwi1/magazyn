import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { OTP_LENGTH } from "@/config/constants"
import type { TwoFactorMethod } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { RESEND_COOLDOWN_SECONDS } from "./constants"
import { OtpInput } from "./otp-input"
import type { PasswordVerificationStage } from "./types"
import { useCountdown } from "./use-countdown"
import { formatCountdown } from "./utils"
export interface PasswordVerificationCopy {
  title?: string
  description?: string | ((context: { method: TwoFactorMethod }) => string)
  verifiedTitle?: string
  verifiedDescription?: string
}

interface PasswordVerificationSectionProps {
  method: TwoFactorMethod
  onVerify: (code: string) => void | Promise<void>
  onRequestCode: (method: TwoFactorMethod) => Promise<void>
  onInputChange: (code: string) => void
  code: string
  copy?: PasswordVerificationCopy
  showTitle?: boolean
  className?: string
  isVerified?: boolean
  isVerifying?: boolean
  verificationError?: string
  autoVerify?: boolean
}

interface PasswordVerificationFlowHandlers {
  method: TwoFactorMethod
  onStageChange: (stage: PasswordVerificationStage) => void
  onErrorChange: (error: string) => void
  onResendCooldownChange: (cooldown: number) => void
  onRequestCode: (method: TwoFactorMethod) => Promise<void>
}

interface PasswordVerificationState {
  stage: PasswordVerificationStage
  error: string
}

function usePasswordVerificationFlow({
  method,
  onStageChange,
  onErrorChange,
  onResendCooldownChange,
  onRequestCode,
}: PasswordVerificationFlowHandlers) {
  const t = useTranslations()

  const requestCode = async (startTimer = true): Promise<void> => {
    onStageChange("SENDING")
    onErrorChange("")

    try {
      await onRequestCode(method)
      onStageChange("AWAITING")
      if (startTimer) {
        onResendCooldownChange(RESEND_COOLDOWN_SECONDS)
      }
    } catch {
      onStageChange("ERROR")
      const message = t("generated.dashboard.settings.failedSendCodeAgain")
      onErrorChange(message)
      toast.error(message)
    }
  }

  return { requestCode }
}

function PasswordVerificationAlerts() {
  const t = useTranslations()

  return (
    <Alert>
      <Spinner className="text-muted-foreground" />
      <AlertTitle>{t("generated.dashboard.settings.sendCode")}</AlertTitle>
      <AlertDescription>
        {t("generated.dashboard.settings.codeGoesSelectedMethod")}
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
  const t = useTranslations()

  return (
    <div className="space-y-3">
      <Label htmlFor="password-2fa-code">
        {t("generated.dashboard.settings.value2faCode")}
      </Label>
      <OtpInput
        disabled={isBusy}
        id="password-2fa-code"
        onChange={onCodeChange}
        value={code}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={code.length !== OTP_LENGTH || isBusy}
          isLoading={isBusy}
          onClick={onVerify}
          type="button"
        >
          {t("generated.shared.verifyCode")}
        </Button>
        {method !== "AUTHENTICATOR" ? (
          <>
            <Button
              aria-describedby="resend-status"
              aria-disabled={!canResend}
              disabled={!canResend}
              onClick={onResend}
              type="button"
              variant="outline"
            >
              {resendCooldown > 0
                ? t("generated.dashboard.settings.resend", {
                    value0: formatCountdown(resendCooldown),
                  })
                : t("generated.shared.resend")}
            </Button>
            <span
              aria-atomic="true"
              aria-live="polite"
              className="sr-only"
              id="resend-status"
            >
              {resendCooldown > 0
                ? t(
                    "generated.dashboard.settings.resendWillAvailableAfterCountdown"
                  )
                : t("generated.dashboard.settings.nowResend")}
            </span>
          </>
        ) : null}
      </div>
    </div>
  )
}

export function PasswordVerificationSection({
  method,
  onVerify,
  onRequestCode,
  onInputChange,
  code,
  copy,
  showTitle = true,
  className,
  isVerified = false,
  isVerifying = false,
  verificationError,
  autoVerify = false,
}: PasswordVerificationSectionProps) {
  const t = useTranslations()

  const [state, setState] = useState<PasswordVerificationState>({
    stage: "IDLE",
    error: "",
  })
  const [resendCooldown, startTimer] = useCountdown(0)
  const { stage, error } = state
  const complete = isVerified
  const isBusy = stage === "SENDING" || isVerifying
  const isSending = stage === "SENDING"
  const canResendCode = resendCooldown === 0 && !isBusy
  const canShowCodeInput =
    method === "AUTHENTICATOR" || stage === "AWAITING" || stage === "ERROR"
  const lastAutoSubmitCodeRef = useRef<string | null>(null)

  useEffect(() => {
    if (!method) {
      return
    }

    setState({
      stage: "IDLE",
      error: "",
    })
    lastAutoSubmitCodeRef.current = null
    startTimer()
  }, [method, startTimer])

  const { requestCode } = usePasswordVerificationFlow({
    method,
    onStageChange: (nextStage) =>
      setState((current) => ({ ...current, stage: nextStage })),
    onErrorChange: (nextError) =>
      setState((current) => ({ ...current, error: nextError })),
    onResendCooldownChange: startTimer,
    onRequestCode,
  })

  const handleStartVerification = useCallback(() => {
    if (method === "AUTHENTICATOR") {
      setState((current) => ({ ...current, stage: "AWAITING" }))
      return
    }

    requestCode()
  }, [method, requestCode])

  const handleResendCode = (): void => {
    if (method === "AUTHENTICATOR") {
      return
    }

    requestCode()
  }

  const handleVerifyCode = (): void => {
    if (isVerifying || complete) {
      return
    }

    if (code.length !== OTP_LENGTH) {
      const message = t(
        "generated.dashboard.settings.enterFullVerificationCode"
      )
      setState((current) => ({ ...current, error: message }))
      toast.error(message)
      return
    }

    setState((current) => ({ ...current, error: "" }))
    lastAutoSubmitCodeRef.current = code
    onVerify(code)
  }

  useEffect(() => {
    if (stage === "IDLE") {
      handleStartVerification()
    }
  }, [stage, handleStartVerification])

  useEffect(() => {
    if (!autoVerify) {
      return
    }

    if (complete || isVerifying || code.length !== OTP_LENGTH) {
      if (code.length !== OTP_LENGTH) {
        lastAutoSubmitCodeRef.current = null
      }
      return
    }

    if (lastAutoSubmitCodeRef.current === code) {
      return
    }

    lastAutoSubmitCodeRef.current = code
    onVerify(code)
  }, [autoVerify, code, complete, isVerifying, onVerify])

  const title =
    copy?.title ?? t("generated.dashboard.settings.confirm2faBeforeChanging")
  const verifiedTitle =
    copy?.verifiedTitle ?? t("generated.dashboard.settings.verified3")
  const verifiedDescription =
    copy?.verifiedDescription ??
    t("generated.dashboard.settings.safelyChangePassword")
  const description = (() => {
    if (copy?.description) {
      return typeof copy.description === "function"
        ? copy.description({ method })
        : copy.description
    }
    return method === "AUTHENTICATOR"
      ? t("generated.dashboard.settings.enterCodeAuthenticatorApp")
      : t("generated.dashboard.settings.willSendCodeSelectedMethod")
  })()
  const resolvedError = verificationError ?? error

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {showTitle ? <p className="font-semibold text-sm">{title}</p> : null}
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <Badge variant={complete ? "success" : "warning"}>
          {complete
            ? t("generated.dashboard.settings.verified3")
            : t("generated.dashboard.settings.required")}
        </Badge>
      </div>

      {complete ? (
        <Alert>
          <AlertTitle>{verifiedTitle}</AlertTitle>
          <AlertDescription>{verifiedDescription}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {resolvedError ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t("generated.dashboard.settings.verified")}
              </AlertTitle>
              <AlertDescription>{resolvedError}</AlertDescription>
            </Alert>
          ) : null}
          {isSending ? <PasswordVerificationAlerts /> : null}
          {canShowCodeInput ? (
            <CodeInputEntry
              canResend={canResendCode}
              code={code}
              isBusy={isBusy}
              method={method}
              onCodeChange={(nextCode) => {
                if (error) {
                  setState((current) => ({ ...current, error: "" }))
                }
                onInputChange(nextCode)
              }}
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
