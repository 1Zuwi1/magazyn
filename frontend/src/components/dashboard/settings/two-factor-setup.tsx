import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  MOCK_AUTHENTICATOR_SECRET,
  OTP_LENGTH,
  QR_PATTERN,
  RECOVERY_CODES,
  RESEND_COOLDOWN_SECONDS,
  TWO_FACTOR_METHODS,
} from "./constants"
import { OtpInput } from "./otp-input"
import type {
  TwoFactorChallenge,
  TwoFactorMethod,
  TwoFactorSetupStage,
  TwoFactorStatus,
} from "./types"
import {
  createTwoFactorChallenge,
  formatCountdown,
  sendVerificationCode,
  verifyOneTimeCode,
} from "./utils"

interface TwoFactorSetupProps {
  status: TwoFactorStatus
  method: TwoFactorMethod
  setupStage: TwoFactorSetupStage
  challenge: TwoFactorChallenge | null
  code: string
  error: string
  resendCooldown: number
  setupNote: string
  showRecoveryCodes: boolean
  onStatusChange: (status: TwoFactorStatus) => void
  onStageChange: (stage: TwoFactorSetupStage) => void
  onMethodChange: (method: TwoFactorMethod) => void
  onChallengeChange: (challenge: TwoFactorChallenge | null) => void
  onCodeChange: (code: string) => void
  onErrorChange: (error: string) => void
  onResendCooldownChange: (cooldown: number) => void
  onSetupNoteChange: (note: string) => void
  onShowRecoveryCodesChange: (show: boolean) => void
}

function TwoFactorStatusBadge({ status }: { status: TwoFactorStatus }): {
  label: string
  variant: "success" | "warning" | "secondary"
} {
  if (status === "enabled") {
    return { label: "Aktywna", variant: "success" }
  }
  if (status === "setup") {
    return { label: "Konfiguracja", variant: "warning" }
  }
  return { label: "Wyłączona", variant: "secondary" }
}

function useTwoFactorSetupFlow(
  status: TwoFactorStatus,
  method: TwoFactorMethod,
  challenge: TwoFactorChallenge | null,
  code: string,
  onStatusChange: (status: TwoFactorStatus) => void,
  onStageChange: (stage: TwoFactorSetupStage) => void,
  onCodeChange: (code: string) => void,
  onErrorChange: (error: string) => void,
  onSetupNoteChange: (note: string) => void,
  onResendCooldownChange: (cooldown: number) => void,
  onChallengeChange: (challenge: TwoFactorChallenge | null) => void
) {
  const resetFlow = (): void => {
    onStageChange("idle")
    onChallengeChange(null)
    onCodeChange("")
    onErrorChange("")
    onResendCooldownChange(0)
    onSetupNoteChange("")
  }

  const startSetup = async (): Promise<void> => {
    if (status !== "disabled") {
      return
    }

    onStatusChange("setup")
    onStageChange("requesting")
    onCodeChange("")
    onErrorChange("")
    onSetupNoteChange("")
    onResendCooldownChange(0)

    try {
      const newChallenge = await createTwoFactorChallenge(method)
      onChallengeChange(newChallenge)

      if (method === "sms" || method === "email") {
        onStageChange("sending")
        await sendVerificationCode(newChallenge.sessionId)
        onStageChange("awaiting")
        onResendCooldownChange(RESEND_COOLDOWN_SECONDS)
        return
      }

      onStageChange("awaiting")
    } catch {
      onStageChange("error")
      onErrorChange("Nie udało się rozpocząć konfiguracji. Spróbuj ponownie.")
    }
  }

  const resendCode = async (): Promise<void> => {
    if (!challenge) {
      return
    }

    onStageChange("sending")
    onErrorChange("")

    try {
      await sendVerificationCode(challenge.sessionId)
      onStageChange("awaiting")
      onResendCooldownChange(RESEND_COOLDOWN_SECONDS)
    } catch {
      onStageChange("error")
      onErrorChange("Nie udało się wysłać kodu. Spróbuj ponownie.")
    }
  }

  const verifySetup = async (): Promise<void> => {
    if (code.length !== OTP_LENGTH) {
      onErrorChange("Wpisz pełny kod weryfikacyjny.")
      return
    }

    onStageChange("verifying")
    onErrorChange("")

    const isValid = await verifyOneTimeCode(code)

    if (isValid) {
      onStageChange("success")
      onStatusChange("enabled")
      onSetupNoteChange(
        "2FA zostało aktywowane. Zapisz kody odzyskiwania i przechowuj je offline."
      )
      return
    }

    onStageChange("error")
    onErrorChange("Kod jest nieprawidłowy. Spróbuj ponownie.")
  }

  return { resetFlow, startSetup, resendCode, verifySetup }
}

function TwoFactorMethodInput({
  disabled,
  method,
  onMethodChange,
}: {
  disabled: boolean
  method: TwoFactorMethod
  onMethodChange: (method: TwoFactorMethod) => void
}) {
  const activeMethod = TWO_FACTOR_METHODS.find((m) => m.value === method)

  const handleMethodChange = (value: string | null): void => {
    if (!value) {
      return
    }
    if (value === "authenticator" || value === "sms" || value === "email") {
      onMethodChange(value as TwoFactorMethod)
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="two-factor-method">Metoda weryfikacji</Label>
      <Select
        disabled={disabled}
        onValueChange={handleMethodChange}
        value={method}
      >
        <SelectTrigger className="w-full" id="two-factor-method">
          <SelectValue
            render={<span>{activeMethod?.label ?? "Wybierz metodę"}</span>}
          />
        </SelectTrigger>
        <SelectContent>
          {TWO_FACTOR_METHODS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              <span className="font-medium">{m.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-sm">{activeMethod?.hint}</p>
    </div>
  )
}

function AuthenticatorSetup({
  challenge,
}: {
  challenge: TwoFactorChallenge | null
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
      <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-3">
        <div className="grid grid-cols-12 gap-0.5">
          {QR_PATTERN.map((row, rowIndex) =>
            row
              .split("")
              .map((cell, cellIndex) => (
                <div
                  className={
                    cell === "1"
                      ? "size-2 rounded-[2px] bg-foreground"
                      : "size-2 rounded-[2px] bg-muted-foreground/15"
                  }
                  key={`${rowIndex}-${cellIndex}`}
                />
              ))
          )}
        </div>
      </div>
      <div className="space-y-2">
        <p className="font-medium text-sm">
          Zeskanuj kod QR lub wprowadź sekret
        </p>
        <p className="text-muted-foreground text-sm">
          Użyj aplikacji uwierzytelniającej (np. Google Authenticator, Authy).
        </p>
        <Input
          className="font-mono text-xs"
          readOnly
          value={challenge?.secret ?? MOCK_AUTHENTICATOR_SECRET}
        />
        <p className="text-muted-foreground text-xs">
          Token wygenerowano o {challenge?.issuedAt ?? "teraz"}.
        </p>
      </div>
    </div>
  )
}

function CodeInputEntry({
  method,
  challenge,
  code,
  resendCooldown,
  isBusy,
  canResend,
  onCodeChange,
  onResend,
  onVerify,
}: {
  method: TwoFactorMethod
  challenge: TwoFactorChallenge | null
  code: string
  resendCooldown: number
  isBusy: boolean
  canResend: boolean
  onCodeChange: (code: string) => void
  onResend: () => void
  onVerify: () => void
}) {
  return (
    <div className="space-y-4">
      {method === "authenticator" ? (
        <AuthenticatorSetup challenge={challenge} />
      ) : (
        <div className="space-y-2">
          <p className="font-medium text-sm">Kod jednorazowy</p>
          <p className="text-muted-foreground text-sm">
            {method === "sms"
              ? "SMS z kodem został wysłany."
              : "E-mail z kodem został wysłany."}{" "}
            Kontakt: {challenge?.destination ?? "wybrana metoda"}.
          </p>
          <p className="text-muted-foreground text-xs">
            Możesz poprosić o ponowną wysyłkę, jeśli kod nie dotarł.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="two-factor-code">Kod weryfikacyjny</Label>
        <OtpInput id="two-factor-code" onChange={onCodeChange} value={code} />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={code.length !== OTP_LENGTH}
            isLoading={isBusy}
            onClick={onVerify}
            type="button"
          >
            Zweryfikuj i aktywuj
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
    </div>
  )
}

function RecoveryCodesSection({
  enabled,
  showRecoveryCodes,
  onToggle,
}: {
  enabled: boolean
  showRecoveryCodes: boolean
  onToggle: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Label htmlFor="recovery-codes">Kody odzyskiwania</Label>
          <p className="text-muted-foreground text-sm">
            Przechowuj je w bezpiecznym miejscu.
          </p>
        </div>
        <Button
          disabled={!enabled}
          onClick={onToggle}
          type="button"
          variant="outline"
        >
          {showRecoveryCodes ? "Ukryj" : "Pokaż"}
        </Button>
      </div>

      {showRecoveryCodes ? (
        <Textarea
          className="min-h-28"
          id="recovery-codes"
          readOnly
          value={RECOVERY_CODES.join("\n")}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          {enabled
            ? 'Kliknij "Pokaż", aby wyświetlić kody.'
            : "Włącz 2FA, aby wygenerować kody."}
        </p>
      )}
    </div>
  )
}

function TwoFactorToggleSection({
  status,
  isBusy,
  onToggle,
}: {
  status: TwoFactorStatus
  isBusy: boolean
  onToggle: (checked: boolean) => void
}) {
  const statusBadge = TwoFactorStatusBadge({ status })

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor="two-factor">Weryfikacja 2FA</Label>
        <p
          className="text-muted-foreground text-sm"
          id="two-factor-description"
        >
          Potwierdzaj logowanie i zmianę hasła dodatkowym kodem.
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Switch
          aria-describedby="two-factor-description"
          checked={status !== "disabled"}
          disabled={isBusy}
          id="two-factor"
          onCheckedChange={onToggle}
        />
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </div>
    </div>
  )
}

function TwoFactorConfigurationSection({
  status,
  setupStage,
  method,
  onMethodChange,
  onStartSetup,
  onCancelSetup,
}: {
  status: TwoFactorStatus
  setupStage: TwoFactorSetupStage
  method: TwoFactorMethod
  onMethodChange: (method: TwoFactorMethod) => void
  onStartSetup: () => void
  onCancelSetup: () => void
}) {
  const canSelectMethod = status === "disabled" && setupStage === "idle"

  return (
    <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="font-semibold">Konfiguracja 2FA</p>
          <p className="text-muted-foreground text-sm">
            Dodaj drugi krok weryfikacji i chroń krytyczne działania.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "disabled" ? (
            <Button
              isLoading={setupStage === "requesting"}
              onClick={onStartSetup}
              type="button"
            >
              Rozpocznij konfigurację
            </Button>
          ) : null}
          {status === "setup" ? (
            <Button onClick={onCancelSetup} type="button" variant="outline">
              Anuluj konfigurację
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 text-muted-foreground text-xs sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <Badge variant={status !== "disabled" ? "success" : "outline"}>
            1
          </Badge>
          <span>Wybierz metodę</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              status === "enabled" ||
              setupStage === "awaiting" ||
              setupStage === "verifying" ||
              setupStage === "error"
                ? "success"
                : "outline"
            }
          >
            2
          </Badge>
          <span>Potwierdź kod</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === "enabled" ? "success" : "outline"}>
            3
          </Badge>
          <span>Zapisz kody</span>
        </div>
      </div>

      <TwoFactorMethodInput
        disabled={!canSelectMethod}
        method={method}
        onMethodChange={onMethodChange}
      />
    </div>
  )
}

export function TwoFactorSetup({
  status,
  method,
  setupStage,
  challenge,
  code,
  error,
  resendCooldown,
  setupNote,
  showRecoveryCodes,
  onStatusChange,
  onStageChange,
  onMethodChange,
  onChallengeChange,
  onCodeChange,
  onErrorChange,
  onResendCooldownChange,
  onSetupNoteChange,
  onShowRecoveryCodesChange,
}: TwoFactorSetupProps) {
  const enabled = status === "enabled"
  const setupActive = status === "setup"
  const isBusy =
    setupStage === "requesting" ||
    setupStage === "sending" ||
    setupStage === "verifying"
  const showCodeEntry =
    setupStage === "awaiting" ||
    setupStage === "verifying" ||
    setupStage === "error"
  const canResendCode = resendCooldown === 0 && !isBusy

  const { resetFlow, startSetup, resendCode, verifySetup } =
    useTwoFactorSetupFlow(
      status,
      method,
      challenge,
      code,
      onStatusChange,
      onStageChange,
      onCodeChange,
      onErrorChange,
      onSetupNoteChange,
      onResendCooldownChange,
      onChallengeChange
    )

  const handleToggle = (checked: boolean): void => {
    if (!checked) {
      onStatusChange("disabled")
      resetFlow()
      return
    }

    if (status === "disabled") {
      startSetup()
    }
  }

  const handleCancelSetup = (): void => {
    onStatusChange("disabled")
    resetFlow()
  }

  const handleResendCode = (): void => {
    resendCode()
  }

  const handleVerifyCode = (): void => {
    verifySetup()
  }

  return (
    <div className="space-y-6">
      <TwoFactorToggleSection
        isBusy={isBusy}
        onToggle={handleToggle}
        status={status}
      />

      <TwoFactorConfigurationSection
        method={method}
        onCancelSetup={handleCancelSetup}
        onMethodChange={onMethodChange}
        onStartSetup={startSetup}
        setupStage={setupStage}
        status={status}
      />

      {setupActive ? (
        <div className="space-y-4 rounded-lg border bg-background/80 p-4">
          {setupStage === "requesting" ? (
            <Alert>
              <Spinner className="text-muted-foreground" />
              <AlertTitle>Łączymy się z usługą 2FA</AlertTitle>
              <AlertDescription>
                Generujemy klucz i przygotowujemy kolejne kroki.
              </AlertDescription>
            </Alert>
          ) : null}

          {setupStage === "sending" ? (
            <Alert>
              <Spinner className="text-muted-foreground" />
              <AlertTitle>Wysyłamy kod</AlertTitle>
              <AlertDescription>
                Kod trafia na {challenge?.destination ?? "wybraną metodę"}.
              </AlertDescription>
            </Alert>
          ) : null}

          {setupStage === "error" && error ? (
            <Alert variant="destructive">
              <AlertTitle>Nie udało się aktywować 2FA</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {showCodeEntry ? (
            <CodeInputEntry
              canResend={canResendCode}
              challenge={challenge}
              code={code}
              isBusy={setupStage === "verifying"}
              method={method}
              onCodeChange={onCodeChange}
              onResend={handleResendCode}
              onVerify={handleVerifyCode}
              resendCooldown={resendCooldown}
            />
          ) : null}
        </div>
      ) : null}

      {status === "enabled" ? (
        <Alert>
          <AlertTitle>2FA aktywna</AlertTitle>
          <AlertDescription>
            {setupNote ||
              "Logowanie i zmiana hasła wymagają kodu. Jeśli utracisz dostęp, użyj kodów odzyskiwania."}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="h-px bg-border" />

      <RecoveryCodesSection
        enabled={enabled}
        onToggle={() => onShowRecoveryCodesChange(!showRecoveryCodes)}
        showRecoveryCodes={showRecoveryCodes}
      />
    </div>
  )
}
