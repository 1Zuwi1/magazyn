import {
  Cancel01Icon,
  Copy01Icon,
  Key01Icon,
  StarIcon,
  Tick01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "next-intl"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { OTP_LENGTH } from "@/config/constants"
import useLinkedMethods from "@/hooks/use-linked-methods"
import useRemoveMethod from "@/hooks/use-remove-method"
import useSetDefaultMethod from "@/hooks/use-set-default-method"
import {
  ResendMethods,
  type ResendType,
  type TwoFactorMethod,
} from "@/lib/schemas"
import {
  AUTHENTICATOR_QR_SIZE,
  COPY_FEEDBACK_TIMEOUT_MS,
  METHOD_ICONS,
  MOCK_AUTHENTICATOR_SECRET,
  RECOVERY_CODES,
  TWO_FACTOR_METHODS,
  TWO_FACTOR_RESEND_SECONDS,
} from "./constants"
import { OtpInput } from "./otp-input"
import { generateTotpUri, QRCodeDisplay } from "./qr-code"
import type {
  TwoFactorChallenge,
  TwoFactorSetupStage,
  TwoFactorStatus,
} from "./types"
import { useCountdown } from "./use-countdown"
import {
  createTwoFactorChallenge,
  formatCountdown,
  sendTwoFactorCode,
  verifyOneTimeCode,
} from "./utils"

const TWO_FACTOR_METHOD_HINTS: Record<TwoFactorMethod, string> = {
  AUTHENTICATOR: "Najpewniejsza metoda",
  SMS: "Kod SMS",
  EMAIL: "Kod e-mail",
  PASSKEYS: "Uwierzytelnianie kluczem dostępu",
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
      candidate.addable &&
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

const getResendMethod = (method: TwoFactorMethod): ResendType | null => {
  const parsed = ResendMethods.safeParse(method)
  return parsed.success ? parsed.data : null
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

  return (
    <RadioGroup
      className={"grid grid-cols-1 gap-3"}
      disabled={disabled}
      onValueChange={(value) => {
        onMethodChange(value as TwoFactorMethod)
      }}
      value={method}
    >
      {methodsToShow.map((m) => {
        const Icon = METHOD_ICONS[m.value as TwoFactorMethod]
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
  userEmail?: string
}

function useTwoFactorSetupFlow({
  status,
  method,
  setupState,
  dispatch,
  startTimer,
  onSuccess,
  userEmail,
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
    if (method === "PASSKEYS") {
      toast.error("Dodaj klucz bezpieczeństwa w sekcji poniżej.")
      return
    }

    dispatch({ type: "set_error", error: "" })
    dispatch({ type: "set_code", code: "" })
    dispatch({ type: "set_stage", stage: "REQUESTING" })

    try {
      const newChallenge = await createTwoFactorChallenge(
        method,
        locale,
        userEmail
      )
      dispatch({ type: "set_challenge", challenge: newChallenge })
      const resendMethod = getResendMethod(method)

      if (resendMethod) {
        dispatch({ type: "set_stage", stage: "SENDING" })
        await sendTwoFactorCode(resendMethod)
        startTimer(TWO_FACTOR_RESEND_SECONDS)
      }

      dispatch({ type: "set_stage", stage: "AWAITING" })
    } catch {
      const message =
        "Nie udało się zainicjować konfiguracji. Spróbuj ponownie."
      dispatch({ type: "set_error", error: message })
      dispatch({ type: "set_stage", stage: "ERROR" })
      toast.error(message)
    }
  }

  const resendCode = async () => {
    const resendMethod = getResendMethod(method)
    if (!(challenge && resendMethod)) {
      return
    }

    dispatch({ type: "set_error", error: "" })
    dispatch({ type: "set_stage", stage: "SENDING" })

    try {
      await sendTwoFactorCode(resendMethod)
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
      const isValid = await verifyOneTimeCode(code, method)

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
  defaultMethod,
  isLoading,
  onDefaultMethodChange,
  isSettingDefault,
  onRemoveMethod,
  removingMethod,
}: {
  linkedMethods?: TwoFactorMethod[]
  defaultMethod?: TwoFactorMethod
  isLoading: boolean
  onDefaultMethodChange: (method: TwoFactorMethod) => void
  isSettingDefault: boolean
  onRemoveMethod: (method: TwoFactorMethod) => void
  removingMethod: TwoFactorMethod | null
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

  const hasMultipleMethods = linkedMethods.length > 1

  return (
    <div className="space-y-2">
      {linkedMethods.map((linkedMethod) => {
        const Icon = METHOD_ICONS[linkedMethod]
        const label = TWO_FACTOR_METHOD_LABELS[linkedMethod] ?? linkedMethod
        const hint = TWO_FACTOR_METHOD_HINTS[linkedMethod]
        const isDefault = linkedMethod === defaultMethod

        return (
          <div
            className={`group relative flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
              isDefault
                ? "border-amber-500/30 bg-linear-to-r from-amber-500/5 via-green-500/5 to-transparent hover:border-amber-500/40"
                : "border-green-500/20 bg-linear-to-r from-green-500/5 to-transparent hover:border-green-500/30 hover:from-green-500/10"
            }`}
            key={linkedMethod}
          >
            {linkedMethod !== "EMAIL" && linkedMethod !== "PASSKEYS" ? (
              <Tooltip>
                <TooltipTrigger
                  aria-label={`Usuń metodę ${label}`}
                  className="absolute top-1.5 right-1.5 inline-flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground/50 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50 group-hover:opacity-100"
                  disabled={removingMethod === linkedMethod}
                  onClick={() => onRemoveMethod(linkedMethod)}
                >
                  {removingMethod === linkedMethod ? (
                    <Spinner className="size-3" />
                  ) : (
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={12}
                      strokeWidth={2}
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent>Usuń</TooltipContent>
              </Tooltip>
            ) : null}
            <div
              className={`flex size-9 items-center justify-center rounded-full ring-1 ${
                isDefault
                  ? "bg-amber-500/10 ring-amber-500/30"
                  : "bg-green-500/10 ring-green-500/20"
              }`}
            >
              <HugeiconsIcon
                className={
                  isDefault
                    ? "text-amber-600 dark:text-amber-500"
                    : "text-green-600 dark:text-green-500"
                }
                icon={Icon}
                size={18}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{label}</p>
                {isDefault ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-500">
                        <HugeiconsIcon icon={StarIcon} size={12} />
                        <span className="font-medium text-[10px] uppercase tracking-wide">
                          Domyślna
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Ta metoda będzie używana jako pierwsza podczas logowania
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">{hint}</p>
            </div>
            <div className="mr-2 flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-1 text-green-600 dark:text-green-500">
              <HugeiconsIcon icon={Tick01Icon} size={14} />
              <span className="font-medium text-xs">Aktywna</span>
            </div>
          </div>
        )
      })}

      {hasMultipleMethods ? (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-muted-foreground/20 border-dashed bg-muted/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={StarIcon}
              size={14}
            />
            <span className="text-muted-foreground text-xs">
              Domyślna metoda:{" "}
              <span className="font-medium text-foreground">
                {defaultMethod
                  ? (TWO_FACTOR_METHOD_LABELS[defaultMethod] ?? defaultMethod)
                  : "Nie ustawiono"}
              </span>
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-3 font-medium text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              disabled={isSettingDefault}
            >
              {isSettingDefault ? <Spinner className="mr-1.5 size-3" /> : null}
              Zmień
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Wybierz domyślną metodę</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  onValueChange={(value) =>
                    onDefaultMethodChange(value as TwoFactorMethod)
                  }
                  value={defaultMethod}
                >
                  {linkedMethods.map((method) => {
                    const MethodIcon = METHOD_ICONS[method]
                    return (
                      <DropdownMenuRadioItem key={method} value={method}>
                        <HugeiconsIcon
                          className="mr-2 text-muted-foreground"
                          icon={MethodIcon}
                          size={16}
                        />
                        {TWO_FACTOR_METHOD_LABELS[method] ?? method}
                      </DropdownMenuRadioItem>
                    )
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
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
  const accountName =
    challenge?.accountName ?? userEmail ?? "user@magazynpro.pl"
  const issuer = challenge?.issuer ?? "MagazynPro"
  const totpUri = generateTotpUri(secret, accountName, issuer)
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
  const canSendCode = getResendMethod(method) !== null

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
          {canSendCode ? (
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
  defaultMethod,
  isLinkedMethodsLoading,
  onDefaultMethodChange,
  isSettingDefault,
  onRemoveMethod,
  removingMethod,
}: {
  status: TwoFactorStatus
  setupStage: TwoFactorSetupStage
  method: TwoFactorMethod
  onMethodChange: (method: TwoFactorMethod) => void
  onStartSetup: () => void
  onCancelSetup: () => void
  linkedMethods?: TwoFactorMethod[]
  defaultMethod?: TwoFactorMethod
  isLinkedMethodsLoading: boolean
  onDefaultMethodChange: (method: TwoFactorMethod) => void
  isSettingDefault: boolean
  onRemoveMethod: (method: TwoFactorMethod) => void
  removingMethod: TwoFactorMethod | null
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
          defaultMethod={defaultMethod}
          isLoading={isLinkedMethodsLoading}
          isSettingDefault={isSettingDefault}
          linkedMethods={linkedMethods}
          onDefaultMethodChange={onDefaultMethodChange}
          onRemoveMethod={onRemoveMethod}
          removingMethod={removingMethod}
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
  } = useLinkedMethods()

  const setDefaultMethodMutation = useSetDefaultMethod()
  const removeMethodMutation = useRemoveMethod()
  const [removingMethod, setRemovingMethod] = useState<TwoFactorMethod | null>(
    null
  )

  const handleDefaultMethodChange = (newDefaultMethod: TwoFactorMethod) => {
    setDefaultMethodMutation.mutate(newDefaultMethod, {
      onSuccess: () => {
        toast.success(
          `Metoda ${TWO_FACTOR_METHOD_LABELS[newDefaultMethod]} została ustawiona jako domyślna`
        )
      },
    })
  }

  const handleRemoveMethod = (methodToRemove: TwoFactorMethod) => {
    setRemovingMethod(methodToRemove)
    removeMethodMutation.mutate(methodToRemove, {
      onSuccess: () => {
        toast.success(
          `Metoda ${TWO_FACTOR_METHOD_LABELS[methodToRemove]} została usunięta`
        )
        setRemovingMethod(null)
      },
    })
  }

  useEffect(() => {
    if (!linkedMethods) {
      return
    }
    if (linkedMethods.methods.includes(method)) {
      const available = TWO_FACTOR_METHODS.find(
        (m) => !linkedMethods.methods.includes(m.value)
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
      userEmail,
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
        defaultMethod={linkedMethods?.defaultMethod}
        isLinkedMethodsLoading={isLinkedMethodsLoading}
        isSettingDefault={setDefaultMethodMutation.isPending}
        linkedMethods={linkedMethods?.methods}
        method={method}
        onCancelSetup={handleCancelSetup}
        onDefaultMethodChange={handleDefaultMethodChange}
        onMethodChange={onMethodChange}
        onRemoveMethod={handleRemoveMethod}
        onStartSetup={startSetup}
        removingMethod={removingMethod}
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
