import {
  Copy01Icon,
  Key01Icon,
  Mail01Icon,
  SmartPhone01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  MOCK_AUTHENTICATOR_SECRET,
  OTP_LENGTH,
  RECOVERY_CODES,
  TWO_FACTOR_METHODS,
} from "./constants"
import { OtpInput } from "./otp-input"
import { generateTotpUri, QRCodeDisplay } from "./qr-code"
import type {
  TwoFactorChallenge,
  TwoFactorMethod,
  TwoFactorSetupStage,
  TwoFactorStatus,
} from "./types"
import { useCountdown } from "./use-countdown"
import {
  createTwoFactorChallenge,
  formatCountdown,
  sendVerificationCode,
  verifyOneTimeCode,
} from "./utils"

function TwoFactorMethodInput({
  method,
  onMethodChange,
  disabled,
}: {
  method: TwoFactorMethod
  onMethodChange: (method: TwoFactorMethod) => void
  disabled?: boolean
}) {
  const icons = {
    authenticator: Key01Icon,
    sms: SmartPhone01Icon,
    email: Mail01Icon,
  }

  return (
    <RadioGroup
      className="grid gap-3 sm:grid-cols-3"
      disabled={disabled}
      onValueChange={(value) => {
        onMethodChange(value as TwoFactorMethod)
      }}
      value={method}
    >
      {TWO_FACTOR_METHODS.map((m) => {
        const Icon = icons[m.value as keyof typeof icons]
        const isSelected = method === m.value

        return (
          <div key={m.value}>
            <RadioGroupItem
              className="peer sr-only"
              id={`method-${m.value}`}
              value={m.value}
            />
            <Label
              className={`flex cursor-pointer flex-col items-center justify-between gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary ${
                disabled ? "pointer-events-none opacity-50" : ""
              }`}
              htmlFor={`method-${m.value}`}
            >
              <HugeiconsIcon
                className={`size-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                icon={Icon}
              />
              <div className="text-center">
                <p className="font-semibold text-sm leading-none">{m.label}</p>
              </div>
            </Label>
          </div>
        )
      })}
    </RadioGroup>
  )
}

function useTwoFactorSetupFlow(
  status: TwoFactorStatus,
  method: TwoFactorMethod,
  challenge: TwoFactorChallenge | null,
  code: string,
  onStatusChange: (status: TwoFactorStatus) => void,
  setSetupStage: (stage: TwoFactorSetupStage) => void,
  setCode: (code: string) => void,
  setError: (error: string) => void,
  setSetupNote: (note: string) => void,
  setResendCooldown: (cooldown: number) => void,
  setChallenge: (challenge: TwoFactorChallenge | null) => void
) {
  const resetFlow = useCallback(() => {
    setSetupStage("idle")
    setChallenge(null)
    setCode("")
    setError("")
    setSetupNote("")
    setResendCooldown(0)
  }, [
    setSetupStage,
    setChallenge,
    setCode,
    setError,
    setSetupNote,
    setResendCooldown,
  ])

  // If method changes while in idle, we don't need to do much,
  // but if we were in the middle of a flow, we should probably reset or update.
  // The requirement says: "ensure that when a user changes the method, the contact information (destination) updates correctly"
  useEffect(() => {
    if (status === "disabled") {
      resetFlow()
    }
  }, [status, resetFlow])

  const startSetup = async () => {
    setError("")
    setSetupStage("requesting")
    onStatusChange("setup")

    try {
      const newChallenge = await createTwoFactorChallenge(method)
      setChallenge(newChallenge)
      setSetupStage("awaiting")
    } catch {
      setError("Nie udało się zainicjować konfiguracji. Spróbuj ponownie.")
      setSetupStage("error")
    }
  }

  const resendCode = async () => {
    if (!challenge) {
      return
    }

    setError("")
    setSetupStage("sending")

    try {
      await sendVerificationCode(challenge.sessionId)
      setResendCooldown(60)
      setSetupStage("awaiting")
    } catch {
      setError("Nie udało się wysłać kodu. Spróbuj ponownie.")
      setSetupStage("error")
    }
  }

  const verifySetup = async () => {
    setSetupStage("verifying")
    setError("")

    try {
      const isValid = await verifyOneTimeCode(code)

      if (isValid) {
        onStatusChange("enabled")
        setSetupStage("idle")
        setSetupNote(
          `Weryfikacja dwuetapowa została włączona przy użyciu: ${
            TWO_FACTOR_METHODS.find((m) => m.value === method)?.label
          }.`
        )
      } else {
        setError("Nieprawidłowy kod weryfikacyjny. Spróbuj ponownie.")
        setSetupStage("error")
      }
    } catch {
      setError("Wystąpił błąd podczas weryfikacji. Spróbuj ponownie.")
      setSetupStage("error")
    }
  }

  return { resetFlow, startSetup, resendCode, verifySetup }
}

interface TwoFactorSetupProps {
  status: TwoFactorStatus
  method: TwoFactorMethod
  onStatusChange: (status: TwoFactorStatus) => void
  onMethodChange: (method: TwoFactorMethod) => void
  userEmail?: string
}

function AuthenticatorSetup({
  challenge,
  userEmail,
}: {
  challenge: TwoFactorChallenge | null
  userEmail?: string
}) {
  const [copied, setCopied] = useState(false)
  const secret = challenge?.secret ?? MOCK_AUTHENTICATOR_SECRET
  const totpUri = generateTotpUri(secret, userEmail ?? "user@magazynpro.pl")

  const handleCopySecret = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(secret.replace(/\s/g, ""))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        <QRCodeDisplay size={140} value={totpUri} />
        <p className="text-center text-muted-foreground text-xs">
          Zeskanuj kodem QR
        </p>
      </div>
      <div className="space-y-3">
        <div>
          <p className="font-medium text-sm">Lub wprowadź klucz ręcznie</p>
          <p className="text-muted-foreground text-sm">
            Użyj aplikacji uwierzytelniającej (Google Authenticator, Authy,
            1Password).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1 font-mono text-xs tracking-wider"
            readOnly
            value={secret}
          />
          <Button
            onClick={handleCopySecret}
            size="icon"
            type="button"
            variant="outline"
          >
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Wygenerowano:{" "}
          {challenge?.issuedAt ?? new Date().toLocaleTimeString("pl-PL")}
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
  userEmail,
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
  userEmail?: string
}) {
  return (
    <div className="space-y-4">
      {method === "authenticator" ? (
        <AuthenticatorSetup challenge={challenge} userEmail={userEmail} />
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
  // User can only change method in Step 1 (when not in setup phase or fully enabled)
  const canSelectMethod =
    (status === "disabled" || setupStage === "idle") && status !== "enabled"

  // Step 1 is complete when setup has started (method selected)
  const step1Complete = status === "setup" || status === "enabled"

  // Step 2 is complete when awaiting code entry or beyond
  const step2Complete =
    status === "enabled" ||
    (status === "setup" &&
      (setupStage === "awaiting" ||
        setupStage === "verifying" ||
        setupStage === "error"))

  // Step 3 is complete only when fully enabled
  const step3Complete = status === "enabled"

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
          <Badge variant={step1Complete ? "success" : "outline"}>1</Badge>
          <span>Wybierz metodę</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={step2Complete ? "success" : "outline"}>2</Badge>
          <span>Potwierdź kod</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={step3Complete ? "success" : "outline"}>3</Badge>
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
  onStatusChange,
  onMethodChange,
  userEmail,
}: TwoFactorSetupProps) {
  const [setupStage, setSetupStage] = useState<TwoFactorSetupStage>("idle")
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null)
  const [code, setCode] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [resendCooldown, setResendCooldown] = useCountdown(0)
  const [setupNote, setSetupNote] = useState<string>("")
  const [showRecoveryCodes, setShowRecoveryCodes] = useState<boolean>(false)
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
      setSetupStage,
      setCode,
      setError,
      setSetupNote,
      setResendCooldown,
      setChallenge
    )

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
              onCodeChange={setCode}
              onResend={handleResendCode}
              onVerify={handleVerifyCode}
              resendCooldown={resendCooldown}
              userEmail={userEmail}
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
        onToggle={() => setShowRecoveryCodes((current) => !current)}
        showRecoveryCodes={showRecoveryCodes}
      />
    </div>
  )
}
