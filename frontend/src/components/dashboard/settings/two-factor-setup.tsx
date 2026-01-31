import {
  Copy01Icon,
  Key01Icon,
  Mail01Icon,
  SmartPhone01Icon,
  Tick01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"
import { useLocale } from "next-intl"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { OTP_LENGTH } from "@/config/constants"
import { apiFetch } from "@/lib/fetcher"
import { TFASchema } from "@/lib/schemas"
import {
  AUTHENTICATOR_QR_SIZE,
  COPY_FEEDBACK_TIMEOUT_MS,
  MOCK_AUTHENTICATOR_SECRET,
  RECOVERY_CODES,
  TWO_FACTOR_METHODS,
  TWO_FACTOR_RESEND_SECONDS,
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

const TWO_FACTOR_METHOD_ICONS: Record<TwoFactorMethod, typeof Key01Icon> = {
  AUTHENTICATOR: Key01Icon,
  SMS: SmartPhone01Icon,
  EMAIL: Mail01Icon,
}

const TWO_FACTOR_METHOD_HINTS: Record<TwoFactorMethod, string> = {
  AUTHENTICATOR: "Najpewniejsza metoda",
  SMS: "Kod SMS",
  EMAIL: "Kod e-mail",
}

const TWO_FACTOR_METHOD_LABELS: Record<TwoFactorMethod, string> =
  TWO_FACTOR_METHODS.reduce(
    (acc, current) => {
      acc[current.value] = current.label
      return acc
    },
    {} as Record<TwoFactorMethod, string>
  )

const isIdleSetupStage = (stage: TwoFactorSetupStage): boolean =>
  stage === "IDLE" || stage === "SUCCESS"

const getLinkedMethodsState = (
  linkedMethods: TwoFactorMethod[] | undefined,
  method: TwoFactorMethod
) => {
  const safeLinkedMethods = linkedMethods ?? []
  const availableMethods = TWO_FACTOR_METHODS.filter(
    (candidate) =>
      !safeLinkedMethods.includes(candidate.value as TwoFactorMethod)
  )
  const hasAvailableMethods = availableMethods.length > 0
  const isSelectedLinked = safeLinkedMethods.includes(method)

  return {
    availableMethods,
    hasAvailableMethods,
    isSelectedLinked,
    hasLinkedMethods: safeLinkedMethods.length > 0,
  }
}

const getCanStartSetup = ({
  status,
  isIdleStage,
  linkedMethods,
  hasAvailableMethods,
  isSelectedLinked,
}: {
  status: TwoFactorStatus
  isIdleStage: boolean
  linkedMethods: TwoFactorMethod[] | undefined
  hasAvailableMethods: boolean
  isSelectedLinked: boolean
}): boolean => {
  if (!isIdleStage) {
    return false
  }

  if (status === "DISABLED") {
    return true
  }

  if (status !== "ENABLED") {
    return false
  }

  if (!(linkedMethods && hasAvailableMethods)) {
    return false
  }

  return !isSelectedLinked
}

const getLinkedMethodsHint = ({
  status,
  linkedMethods,
  hasAvailableMethods,
  isSelectedLinked,
}: {
  status: TwoFactorStatus
  linkedMethods: TwoFactorMethod[] | undefined
  hasAvailableMethods: boolean
  isSelectedLinked: boolean
}): string | null => {
  if (status !== "ENABLED" || linkedMethods === undefined) {
    return null
  }

  if (!hasAvailableMethods) {
    return "Wszystkie dostępne metody są już połączone."
  }

  if (isSelectedLinked) {
    return "Wybrana metoda jest już połączona. Wybierz inną, aby dodać nową."
  }

  return "Wybierz metodę, którą chcesz dodać."
}

function TwoFactorMethodInput({
  method,
  onMethodChange,
  disabled,
  availableMethods,
}: {
  method: TwoFactorMethod
  onMethodChange: (method: TwoFactorMethod) => void
  disabled?: boolean
  availableMethods?: TwoFactorMethod[]
}) {
  // If availableMethods is provided, filter to only those; otherwise show all
  const methodsToShow = availableMethods
    ? TWO_FACTOR_METHODS.filter((m) =>
        availableMethods.includes(m.value as TwoFactorMethod)
      )
    : TWO_FACTOR_METHODS

  // Determine grid columns based on number of methods
  const getGridClass = (count: number): string => {
    if (count === 1) {
      return "grid gap-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1"
    }
    if (count === 2) {
      return "grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2"
    }
    return "grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3"
  }

  return (
    <RadioGroup
      className={getGridClass(methodsToShow.length)}
      disabled={disabled}
      onValueChange={(value) => {
        onMethodChange(value as TwoFactorMethod)
      }}
      value={method}
    >
      {methodsToShow.map((m) => {
        const Icon = TWO_FACTOR_METHOD_ICONS[m.value as TwoFactorMethod]
        const isSelected = method === m.value

        return (
          <div className="flex" key={m.value}>
            <RadioGroupItem
              aria-describedby={`method-${m.value}-hint`}
              aria-label={m.label}
              className="peer sr-only"
              id={`method-${m.value}`}
              value={m.value}
            />
            <div className="sr-only" id={`method-${m.value}-hint`}>
              {m.hint}
            </div>
            <Label
              className={`flex flex-1 cursor-pointer flex-col items-center justify-between gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary ${
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

interface TwoFactorSetupState {
  stage: TwoFactorSetupStage
  challenge: TwoFactorChallenge | null
  code: string
  error: string
  note: string
}

type TwoFactorSetupAction =
  | { type: "reset" }
  | { type: "set_stage"; stage: TwoFactorSetupStage }
  | { type: "set_challenge"; challenge: TwoFactorChallenge | null }
  | { type: "set_code"; code: string }
  | { type: "set_error"; error: string }
  | { type: "set_note"; note: string }

const initialTwoFactorSetupState: TwoFactorSetupState = {
  stage: "IDLE",
  challenge: null,
  code: "",
  error: "",
  note: "",
}

function twoFactorSetupReducer(
  state: TwoFactorSetupState,
  action: TwoFactorSetupAction
): TwoFactorSetupState {
  switch (action.type) {
    case "reset":
      return { ...initialTwoFactorSetupState }
    case "set_stage":
      return { ...state, stage: action.stage }
    case "set_challenge":
      return { ...state, challenge: action.challenge }
    case "set_code":
      return { ...state, code: action.code }
    case "set_error":
      return { ...state, error: action.error }
    case "set_note":
      return { ...state, note: action.note }
    default:
      return state
  }
}

interface TwoFactorSetupFlowParams {
  status: TwoFactorStatus
  method: TwoFactorMethod
  setupState: TwoFactorSetupState
  dispatch: (action: TwoFactorSetupAction) => void
  startTimer: (cooldown?: number) => void
  onSuccess?: () => void
}

function useTwoFactorSetupFlow({
  status,
  method,
  setupState,
  dispatch,
  startTimer,
  onSuccess,
}: TwoFactorSetupFlowParams) {
  const { challenge, code } = setupState
  const resetFlow = useCallback(() => {
    dispatch({ type: "reset" })
    startTimer()
  }, [dispatch, startTimer])
  const locale = useLocale()

  // If method changes while in idle, we don't need to do much,
  // but if we were in the middle of a flow, we should probably reset or update.
  // The requirement says: "ensure that when a user changes the method, the contact information (destination) updates correctly"
  useEffect(() => {
    if (status === "DISABLED") {
      resetFlow()
    }
  }, [status, resetFlow])

  const startSetup = async () => {
    dispatch({ type: "set_error", error: "" })
    dispatch({ type: "set_code", code: "" })
    dispatch({ type: "set_stage", stage: "REQUESTING" })

    try {
      const newChallenge = await createTwoFactorChallenge(method, locale)
      dispatch({ type: "set_challenge", challenge: newChallenge })
      dispatch({ type: "set_stage", stage: "AWAITING" })
      await sendVerificationCode(newChallenge.sessionId)
    } catch {
      const message =
        "Nie udało się zainicjować konfiguracji. Spróbuj ponownie."
      dispatch({ type: "set_error", error: message })
      dispatch({ type: "set_stage", stage: "ERROR" })
      toast.error(message)
    }
  }

  const resendCode = async () => {
    if (!challenge) {
      return
    }

    dispatch({ type: "set_error", error: "" })
    dispatch({ type: "set_stage", stage: "SENDING" })

    try {
      await sendVerificationCode(challenge.sessionId)
      startTimer(TWO_FACTOR_RESEND_SECONDS)
      dispatch({ type: "set_stage", stage: "AWAITING" })
    } catch {
      const message = "Nie udało się wysłać kodu. Spróbuj ponownie."
      dispatch({ type: "set_error", error: message })
      dispatch({ type: "set_stage", stage: "ERROR" })
      toast.error(message)
    }
  }

  const verifySetup = async () => {
    dispatch({ type: "set_stage", stage: "VERIFYING" })
    dispatch({ type: "set_error", error: "" })

    try {
      const isValid = await verifyOneTimeCode(code)

      if (isValid) {
        dispatch({ type: "set_stage", stage: "SUCCESS" })
        dispatch({
          type: "set_note",
          note: `Weryfikacja dwuetapowa została włączona przy użyciu: ${
            TWO_FACTOR_METHODS.find((m) => m.value === method)?.label
          }.`,
        })
        onSuccess?.()
      } else {
        dispatch({
          type: "set_error",
          error: "Nieprawidłowy kod weryfikacyjny. Spróbuj ponownie.",
        })
        dispatch({ type: "set_stage", stage: "ERROR" })
      }
    } catch {
      dispatch({
        type: "set_error",
        error: "Wystąpił błąd podczas weryfikacji. Spróbuj ponownie.",
      })
      dispatch({ type: "set_stage", stage: "ERROR" })
    }
  }

  return { resetFlow, startSetup, resendCode, verifySetup }
}

interface TwoFactorSetupProps {
  status: TwoFactorStatus
  method: TwoFactorMethod
  onMethodChange: (method: TwoFactorMethod) => void
  userEmail?: string
}

function ConnectedMethods({
  linkedMethods,
  isLoading,
}: {
  linkedMethods?: TwoFactorMethod[]
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-muted-foreground/30 border-dashed bg-muted/20 px-4 py-3">
        <Spinner className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">
          Ładowanie połączonych metod...
        </span>
      </div>
    )
  }

  if (!linkedMethods?.length) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-muted-foreground/30 border-dashed bg-muted/20 px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon
            className="text-muted-foreground"
            icon={Key01Icon}
            size={16}
          />
        </div>
        <div>
          <p className="font-medium text-muted-foreground text-sm">
            Brak połączonych metod
          </p>
          <p className="text-muted-foreground/70 text-xs">
            Dodaj metodę weryfikacji, aby zabezpieczyć konto
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {linkedMethods.map((linkedMethod) => {
        const Icon = TWO_FACTOR_METHOD_ICONS[linkedMethod]
        const label = TWO_FACTOR_METHOD_LABELS[linkedMethod] ?? linkedMethod
        const hint = TWO_FACTOR_METHOD_HINTS[linkedMethod]

        return (
          <div
            className="group flex items-center gap-3 rounded-lg border border-green-500/20 bg-linear-to-r from-green-500/5 to-transparent px-4 py-3 transition-all hover:border-green-500/30 hover:from-green-500/10"
            key={linkedMethod}
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
              <HugeiconsIcon
                className="text-green-600 dark:text-green-500"
                icon={Icon}
                size={18}
              />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-muted-foreground text-xs">{hint}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-1 text-green-600 dark:text-green-500">
              <HugeiconsIcon icon={Tick01Icon} size={14} />
              <span className="font-medium text-xs">Aktywna</span>
            </div>
          </div>
        )
      })}
    </div>
  )
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
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const locale = useLocale()

  const handleCopySecret = async (): Promise<void> => {
    if (!navigator.clipboard) {
      toast.error("Schowek jest niedostępny w tej przeglądarce.")
      return
    }

    try {
      await navigator.clipboard.writeText(secret.replace(/\s/g, ""))
      setCopied(true)
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(
        () => setCopied(false),
        COPY_FEEDBACK_TIMEOUT_MS
      )
    } catch {
      toast.error("Nie udało się skopiować klucza. Skopiuj ręcznie.")
    }
  }

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        <QRCodeDisplay size={AUTHENTICATOR_QR_SIZE} value={totpUri} />
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
            aria-label={copied ? "Klucz skopiowany" : "Skopiuj klucz"}
            aria-pressed={copied}
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
          {challenge?.issuedAt ?? new Date().toLocaleTimeString(locale)}
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
      {method === "AUTHENTICATOR" ? (
        <AuthenticatorSetup challenge={challenge} userEmail={userEmail} />
      ) : (
        <div className="space-y-2">
          <p className="font-medium text-sm">Kod jednorazowy</p>
          <p className="text-muted-foreground text-sm">
            {method === "SMS"
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
                  ? `Wyślij ponownie (${formatCountdown(resendCooldown)})`
                  : "Wyślij ponownie"}
              </Button>
              <span
                aria-atomic="true"
                aria-live="polite"
                className="sr-only"
                id="resend-status"
              >
                {resendCooldown > 0
                  ? "Wyślij ponownie będzie dostępne po zakończeniu odliczania."
                  : "Możesz teraz wysłać ponownie."}
              </span>
            </>
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

      {showRecoveryCodes && enabled ? (
        <Textarea
          aria-label="Kody odzyskiwania"
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

const isStepComplete = (
  step: 1 | 2 | 3,
  setupStage: TwoFactorSetupStage
): boolean => {
  const isSetupInProgress =
    setupStage === "REQUESTING" ||
    setupStage === "SENDING" ||
    setupStage === "AWAITING" ||
    setupStage === "VERIFYING" ||
    setupStage === "SUCCESS"
  const isSuccess = setupStage === "SUCCESS"

  switch (step) {
    case 1:
      return isSetupInProgress
    case 2:
    case 3:
      return isSuccess
    default:
      return false
  }
}

function TwoFactorActionButtons({
  status,
  isSetupInProgress,
  canStartSetup,
  setupStage,
  onStartSetup,
  onCancelSetup,
}: {
  status: TwoFactorStatus
  isSetupInProgress: boolean
  canStartSetup: boolean
  setupStage: TwoFactorSetupStage
  onStartSetup: () => void
  onCancelSetup: () => void
}) {
  if (status === "DISABLED" && !isSetupInProgress) {
    return (
      <Button
        disabled={!canStartSetup}
        isLoading={setupStage === "REQUESTING"}
        onClick={onStartSetup}
        type="button"
      >
        Rozpocznij konfigurację
      </Button>
    )
  }

  if (status === "ENABLED" && !isSetupInProgress) {
    return (
      <Button disabled={!canStartSetup} onClick={onStartSetup} type="button">
        Dodaj metodę
      </Button>
    )
  }

  if (status === "SETUP" || isSetupInProgress) {
    return (
      <Button onClick={onCancelSetup} type="button" variant="outline">
        Anuluj konfigurację
      </Button>
    )
  }

  return null
}

function TwoFactorConfigurationSection({
  status,
  setupStage,
  method,
  onMethodChange,
  onStartSetup,
  onCancelSetup,
  linkedMethods,
  isLinkedMethodsLoading,
}: {
  status: TwoFactorStatus
  setupStage: TwoFactorSetupStage
  method: TwoFactorMethod
  onMethodChange: (method: TwoFactorMethod) => void
  onStartSetup: () => void
  onCancelSetup: () => void
  linkedMethods?: TwoFactorMethod[]
  isLinkedMethodsLoading: boolean
}) {
  const isIdleStage = isIdleSetupStage(setupStage)
  const isSetupInProgress = !isIdleStage
  const { hasAvailableMethods, isSelectedLinked, availableMethods } =
    getLinkedMethodsState(linkedMethods, method)
  const canStartSetup = getCanStartSetup({
    status,
    isIdleStage,
    linkedMethods,
    hasAvailableMethods,
    isSelectedLinked,
  })
  const canSelectMethod = isIdleStage
  const linkedMethodsHint = getLinkedMethodsHint({
    status,
    linkedMethods,
    hasAvailableMethods,
    isSelectedLinked,
  })

  return (
    <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="space-y-2">
        <p className="font-medium text-sm">Połączone metody</p>
        <ConnectedMethods
          isLoading={isLinkedMethodsLoading}
          linkedMethods={linkedMethods}
        />
      </div>
      {hasAvailableMethods && !isLinkedMethodsLoading ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">Konfiguracja 2FA</p>
              <p className="text-muted-foreground text-sm">
                Dodaj drugi krok weryfikacji i chroń krytyczne działania.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TwoFactorActionButtons
                canStartSetup={canStartSetup}
                isSetupInProgress={isSetupInProgress}
                onCancelSetup={onCancelSetup}
                onStartSetup={onStartSetup}
                setupStage={setupStage}
                status={status}
              />
            </div>
          </div>

          <div className="grid gap-3 text-muted-foreground text-xs sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Badge
                variant={isStepComplete(1, setupStage) ? "success" : "outline"}
              >
                1
              </Badge>
              <span>Wybierz metodę</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isStepComplete(2, setupStage) ? "success" : "outline"}
              >
                2
              </Badge>
              <span>Potwierdź kod</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isStepComplete(3, setupStage) ? "success" : "outline"}
              >
                3
              </Badge>
              <span>Zapisz kody</span>
            </div>
          </div>
          <TwoFactorMethodInput
            availableMethods={
              status === "ENABLED"
                ? availableMethods.map((m) => m.value as TwoFactorMethod)
                : undefined
            }
            disabled={!canSelectMethod}
            method={method}
            onMethodChange={onMethodChange}
          />
          {linkedMethodsHint ? (
            <p className="text-muted-foreground text-xs">{linkedMethodsHint}</p>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function TwoFactorSetup({
  status,
  method,
  onMethodChange,
  userEmail,
}: TwoFactorSetupProps) {
  const {
    data: linkedMethods,
    isLoading: isLinkedMethodsLoading,
    refetch: refetchLinkedMethods,
  } = useQuery({
    queryKey: ["linked-2fa-methods"],
    queryFn: () => apiFetch("/api/2fa", TFASchema),
  })

  useEffect(() => {
    if (!linkedMethods) {
      return
    }
    if (linkedMethods.includes(method)) {
      const available = TWO_FACTOR_METHODS.find(
        (m) => !linkedMethods.includes(m.value)
      )?.value
      if (available) {
        onMethodChange(available)
      }
    }
  }, [linkedMethods, method, onMethodChange])
  const [setupState, dispatch] = useReducer(
    twoFactorSetupReducer,
    initialTwoFactorSetupState
  )
  const [resendCooldown, startTimer] = useCountdown(0)
  const [showRecoveryCodes, setShowRecoveryCodes] = useState<boolean>(false)
  const { stage: setupStage, challenge, code, error } = setupState
  const enabled = status === "ENABLED"
  const setupActive =
    status === "SETUP" || (setupStage !== "IDLE" && setupStage !== "SUCCESS")
  const isBusy =
    setupStage === "REQUESTING" ||
    setupStage === "SENDING" ||
    setupStage === "VERIFYING"
  const showCodeEntry =
    setupStage === "AWAITING" ||
    setupStage === "VERIFYING" ||
    setupStage === "ERROR"
  const canResendCode = resendCooldown === 0 && !isBusy
  const shouldWarnOnNavigate =
    setupActive && setupStage !== "IDLE" && setupStage !== "SUCCESS"

  useEffect(() => {
    if (!shouldWarnOnNavigate) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [shouldWarnOnNavigate])

  const { resetFlow, startSetup, resendCode, verifySetup } =
    useTwoFactorSetupFlow({
      status,
      method,
      setupState,
      dispatch,
      startTimer,
      onSuccess: () => {
        refetchLinkedMethods().catch((error) => {
          console.error("Failed to refresh linked two-factor methods", error)
          toast.error(
            "We couldn't refresh your two-factor methods. Your new method may not appear until you reload this page."
          )
        })
        resetFlow()
      },
    })

  const handleCancelSetup = (): void => {
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
        isLinkedMethodsLoading={isLinkedMethodsLoading}
        linkedMethods={linkedMethods}
        method={method}
        onCancelSetup={handleCancelSetup}
        onMethodChange={onMethodChange}
        onStartSetup={startSetup}
        setupStage={setupStage}
        status={status}
      />

      {setupActive ? (
        <div className="space-y-4 rounded-lg border bg-background/80 p-4">
          {setupStage === "REQUESTING" ? (
            <Alert>
              <Spinner className="text-muted-foreground" />
              <AlertTitle>Łączymy się z usługą 2FA</AlertTitle>
              <AlertDescription>
                Generujemy klucz i przygotowujemy kolejne kroki.
              </AlertDescription>
            </Alert>
          ) : null}

          {setupStage === "SENDING" ? (
            <Alert>
              <Spinner className="text-muted-foreground" />
              <AlertTitle>Wysyłamy kod</AlertTitle>
              <AlertDescription>
                Kod trafia na {challenge?.destination ?? "wybraną metodę"}.
              </AlertDescription>
            </Alert>
          ) : null}

          {setupStage === "ERROR" && error ? (
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
              isBusy={setupStage === "VERIFYING"}
              method={method}
              onCodeChange={(nextCode) =>
                dispatch({ type: "set_code", code: nextCode })
              }
              onResend={handleResendCode}
              onVerify={handleVerifyCode}
              resendCooldown={resendCooldown}
              userEmail={userEmail}
            />
          ) : null}
        </div>
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
