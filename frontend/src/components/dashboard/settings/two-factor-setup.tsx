import {
  Alert02Icon,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { OTP_LENGTH } from "@/config/constants"
import { useApiMutation } from "@/hooks/use-api-mutation"
import useLinkedMethods, {
  LINKED_2FA_METHODS_QUERY_KEY,
} from "@/hooks/use-linked-methods"
import useRemoveMethod from "@/hooks/use-remove-method"
import useSetDefaultMethod from "@/hooks/use-set-default-method"
import { useAppTranslations } from "@/i18n/use-translations"
import { apiFetch } from "@/lib/fetcher"
import {
  BackupCodesGenerateSchema,
  type RemovableTwoFactorMethod,
  ResendMethods,
  type ResendType,
  type TwoFactorMethod,
} from "@/lib/schemas"
import {
  AUTHENTICATOR_QR_SIZE,
  COPY_FEEDBACK_TIMEOUT_MS,
  getTwoFactorMethods,
  METHOD_ICONS,
  TWO_FACTOR_RESEND_SECONDS,
} from "./constants"
import { OtpInput } from "./otp-input"
import { generateTotpUri, QRCodeDisplay } from "./qr-code"
import type {
  AuthenticatorSetupData,
  TwoFactorSetupStage,
  TwoFactorStatus,
} from "./types"
import { useCountdown } from "./use-countdown"
import {
  createAuthenticatorSetupData,
  formatCountdown,
  sendTwoFactorCode,
  verifyOneTimeCode,
} from "./utils"

const getTwoFactorMethodLabels = (): Record<TwoFactorMethod, string> => {
  const labels = {} as Record<TwoFactorMethod, string>
  for (const method of getTwoFactorMethods()) {
    labels[method.value as TwoFactorMethod] = method.label
  }
  return labels
}

const getTwoFactorMethodHints = (): Record<TwoFactorMethod, string> => {
  const hints = {} as Record<TwoFactorMethod, string>
  for (const method of getTwoFactorMethods()) {
    hints[method.value as TwoFactorMethod] = method.hint
  }
  return hints
}

const isIdleSetupStage = (stage: TwoFactorSetupStage): boolean =>
  stage === "IDLE" || stage === "SUCCESS"

const getLinkedMethodsState = (
  linkedMethods: TwoFactorMethod[] | undefined,
  method: TwoFactorMethod
) => {
  const safeLinkedMethods = linkedMethods ?? []
  const availableMethods = getTwoFactorMethods().filter(
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
  t,
  status,
  linkedMethods,
  hasAvailableMethods,
  isSelectedLinked,
}: {
  t: ReturnType<typeof useAppTranslations>
  status: TwoFactorStatus
  linkedMethods: TwoFactorMethod[] | undefined
  hasAvailableMethods: boolean
  isSelectedLinked: boolean
}): string | null => {
  if (status !== "ENABLED" || linkedMethods === undefined) {
    return null
  }

  if (!hasAvailableMethods) {
    return t("generated.dashboard.settings.allAvailableMethodsAlreadyConnected")
  }

  if (isSelectedLinked) {
    return t(
      "generated.dashboard.settings.selectedMethodAlreadyConnectedSelect"
    )
  }

  return t("generated.dashboard.settings.selectMethodWantAdd")
}

const getResendMethod = (method: TwoFactorMethod): ResendType | null => {
  const parsed = ResendMethods.safeParse(method)
  return parsed.success ? parsed.data : null
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const getPrintableRecoveryCodesDocument = (
  t: ReturnType<typeof useAppTranslations>,
  codes: string[],
  generatedAt: string,
  locale: string
): string => {
  const listMarkup = codes
    .map((code) => `<li>${escapeHtml(code)}</li>`)
    .join("")

  const htmlLanguage = escapeHtml(locale)
  const title = escapeHtml(t("generated.dashboard.settings.recoveryCodes"))
  const generatedLabel = escapeHtml(t("generated.dashboard.settings.generated"))
  const securityNotice = escapeHtml(
    t("generated.dashboard.settings.storeSafePlace")
  )

  return `<!doctype html>
<html lang="${htmlLanguage}">
<head>
  <meta charset="utf-8" />
  <title>${title} GdzieToLeży</title>
  <style>
    body {
      font-family: "Arial", sans-serif;
      margin: 24px;
      color: #111827;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 20px;
    }
    p {
      margin: 0 0 12px;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      columns: 2;
    }
    li {
      font-family: "Courier New", monospace;
      margin-bottom: 6px;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${generatedLabel} ${escapeHtml(generatedAt)}</p>
  <p>${securityNotice}</p>
  <ul>${listMarkup}</ul>
</body>
</html>`
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
  const twoFactorMethods = getTwoFactorMethods()
  // If availableMethods is provided, filter to only those; otherwise show all
  const methodsToShow = availableMethods
    ? twoFactorMethods.filter((m) =>
        availableMethods.includes(m.value as TwoFactorMethod)
      )
    : twoFactorMethods

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
  authenticatorSetupData: AuthenticatorSetupData | null
  code: string
  error: string
}

type TwoFactorSetupAction =
  | { type: "reset" }
  | { type: "set_stage"; stage: TwoFactorSetupStage }
  | {
      type: "set_authenticator_setup_data"
      authenticatorSetupData: AuthenticatorSetupData | null
    }
  | { type: "set_code"; code: string }
  | { type: "set_error"; error: string }

const initialTwoFactorSetupState: TwoFactorSetupState = {
  stage: "IDLE",
  authenticatorSetupData: null,
  code: "",
  error: "",
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
    case "set_authenticator_setup_data":
      return {
        ...state,
        authenticatorSetupData: action.authenticatorSetupData,
      }
    case "set_code":
      return { ...state, code: action.code }
    case "set_error":
      return { ...state, error: action.error }
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
  const t = useAppTranslations()

  const { code } = setupState
  const resetFlow = useCallback(() => {
    dispatch({ type: "reset" })
    startTimer()
  }, [dispatch, startTimer])
  const locale = useLocale()

  useEffect(() => {
    if (status === "DISABLED") {
      resetFlow()
    }
  }, [status, resetFlow])

  const startSetup = async () => {
    if (method === "PASSKEYS") {
      toast.error(t("generated.dashboard.settings.addSecurityKeySectionBelow"))
      return
    }

    dispatch({ type: "set_error", error: "" })
    dispatch({ type: "set_code", code: "" })
    dispatch({
      type: "set_authenticator_setup_data",
      authenticatorSetupData: null,
    })
    dispatch({ type: "set_stage", stage: "REQUESTING" })

    try {
      if (method === "AUTHENTICATOR") {
        const setupData = await createAuthenticatorSetupData(locale)
        dispatch({
          type: "set_authenticator_setup_data",
          authenticatorSetupData: setupData,
        })
      } else {
        const resendMethod = getResendMethod(method)
        if (!resendMethod) {
          throw new Error(
            t("generated.dashboard.settings.unsupportedResendMethod")
          )
        }
        dispatch({ type: "set_stage", stage: "SENDING" })
        await sendTwoFactorCode(resendMethod)
        startTimer(TWO_FACTOR_RESEND_SECONDS)
      }

      dispatch({ type: "set_stage", stage: "AWAITING" })
    } catch {
      const message = t(
        "generated.dashboard.settings.failedInitializeConfigurationAgain"
      )
      dispatch({ type: "set_error", error: message })
      dispatch({ type: "set_stage", stage: "ERROR" })
      toast.error(message)
    }
  }

  const resendCode = async () => {
    const resendMethod = getResendMethod(method)
    if (!resendMethod) {
      return
    }

    dispatch({ type: "set_error", error: "" })
    dispatch({ type: "set_stage", stage: "SENDING" })

    try {
      await sendTwoFactorCode(resendMethod)
      startTimer(TWO_FACTOR_RESEND_SECONDS)
      dispatch({ type: "set_stage", stage: "AWAITING" })
    } catch {
      const message = t("generated.dashboard.settings.failedSendCodeAgain")
      dispatch({ type: "set_error", error: message })
      dispatch({ type: "set_stage", stage: "ERROR" })
      toast.error(message)
    }
  }

  const verifySetup = async (codeOverride?: string) => {
    const codeToVerify = codeOverride ?? code
    dispatch({ type: "set_stage", stage: "VERIFYING" })
    dispatch({ type: "set_error", error: "" })

    try {
      const isValid = await verifyOneTimeCode(codeToVerify, method)

      if (isValid) {
        dispatch({ type: "set_stage", stage: "SUCCESS" })
        onSuccess?.()
      } else {
        dispatch({
          type: "set_error",
          error: t("generated.dashboard.settings.invalidVerificationCodeAgain"),
        })
        dispatch({ type: "set_stage", stage: "ERROR" })
      }
    } catch {
      dispatch({
        type: "set_error",
        error: t("generated.shared.errorOccurredDuringVerificationAgain"),
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
  isError,
  onRetry,
  onDefaultMethodChange,
  isSettingDefault,
  onRemoveMethod,
  removingMethod,
}: {
  linkedMethods?: TwoFactorMethod[]
  defaultMethod?: TwoFactorMethod
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  onDefaultMethodChange: (method: TwoFactorMethod) => void
  isSettingDefault: boolean
  onRemoveMethod: (method: RemovableTwoFactorMethod) => void
  removingMethod: RemovableTwoFactorMethod | null
}) {
  const t = useAppTranslations()

  const twoFactorMethodLabels = getTwoFactorMethodLabels()
  const twoFactorMethodHints = getTwoFactorMethodHints()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
            key={`skeleton-${i.toString()}`}
          >
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/20 border-dashed bg-destructive/5 px-4 py-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
          <HugeiconsIcon
            className="text-destructive"
            icon={Alert02Icon}
            size={20}
          />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground/80 text-sm">
            {t("generated.dashboard.settings.failedLoadMethods")}
          </p>
          <p className="text-muted-foreground text-xs">
            {t(
              "generated.dashboard.settings.problemDownloadingLinkedVerificationMethods"
            )}
          </p>
        </div>
        {onRetry && (
          <button
            className="rounded-md border px-3 py-1.5 font-medium text-xs transition-colors hover:bg-muted"
            onClick={onRetry}
            type="button"
          >
            {t("generated.shared.again")}
          </button>
        )}
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
            {t("generated.dashboard.settings.combinedMethods")}
          </p>
          <p className="text-muted-foreground/70 text-xs">
            {t(
              "generated.dashboard.settings.addVerificationMethodSecureAccount"
            )}
          </p>
        </div>
      </div>
    )
  }

  const hasMultipleMethods = linkedMethods.length > 1
  const setDefaultActionLabel = t("generated.dashboard.settings.change")

  return (
    <div className="space-y-2">
      {linkedMethods.map((linkedMethod) => {
        const Icon = METHOD_ICONS[linkedMethod]
        const label = twoFactorMethodLabels[linkedMethod] ?? linkedMethod
        const hint = twoFactorMethodHints[linkedMethod]
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
                  aria-label={t("generated.dashboard.settings.removeMethod", {
                    value0: label,
                  })}
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
                <TooltipContent>{t("generated.shared.remove")}</TooltipContent>
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
                          {t("generated.dashboard.settings.default")}
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t(
                        "generated.dashboard.settings.methodWillUsedFirstLogging"
                      )}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">{hint}</p>
            </div>
            <div className="mr-2 flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-1 text-green-600 dark:text-green-500">
              <HugeiconsIcon icon={Tick01Icon} size={14} />
              <span className="font-medium text-xs">
                {t("generated.dashboard.settings.active")}
              </span>
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
              {t("generated.dashboard.settings.defaultMethod")}{" "}
              <span className="font-medium text-foreground">
                {defaultMethod
                  ? (twoFactorMethodLabels[defaultMethod] ?? defaultMethod)
                  : t("generated.dashboard.settings.set")}
              </span>
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-3 font-medium text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              disabled={isSettingDefault}
            >
              {isSettingDefault ? <Spinner className="mr-1.5 size-3" /> : null}
              {setDefaultActionLabel}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t("generated.dashboard.settings.selectDefaultMethod")}
                </DropdownMenuLabel>
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
                        {twoFactorMethodLabels[method] ?? method}
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
  authenticatorSetupData,
  userEmail,
}: {
  authenticatorSetupData: AuthenticatorSetupData | null
  userEmail?: string
}) {
  const t = useAppTranslations()

  const [copied, setCopied] = useState(false)
  const secret = authenticatorSetupData?.secret ?? ""
  const accountName = authenticatorSetupData?.accountName ?? userEmail ?? ""
  const issuer = authenticatorSetupData?.issuer ?? ""
  const totpUri = generateTotpUri(secret, accountName, issuer)
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleCopySecret = async (): Promise<void> => {
    if (!navigator.clipboard) {
      toast.error(t("generated.dashboard.settings.clipboardUnavailableBrowser"))
      return
    }

    try {
      await navigator.clipboard.writeText(secret.replace(/\s/g, ""))
      setCopied(true)
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(
        setCopied,
        COPY_FEEDBACK_TIMEOUT_MS,
        false
      )
    } catch {
      toast.error(t("generated.dashboard.settings.failedCopyKeyCopyManually"))
    }
  }

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  if (!secret) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {t("generated.dashboard.settings.applicationConfigurationData")}
        </AlertTitle>
        <AlertDescription>
          {t("generated.dashboard.settings.refreshConfigurationAgain")}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        <QRCodeDisplay size={AUTHENTICATOR_QR_SIZE} value={totpUri} />
        <p className="text-center text-muted-foreground text-xs">
          {t("generated.dashboard.settings.scanQrCode")}
        </p>
      </div>
      <div className="space-y-3">
        <div>
          <p className="font-medium text-sm">
            {t("generated.dashboard.settings.enterKeyManually")}
          </p>
          <p className="text-muted-foreground text-sm">
            {t(
              "generated.dashboard.settings.useAuthenticatorAppGoogleAuthenticator"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1 font-mono text-xs tracking-wider"
            readOnly
            value={secret}
          />
          <Button
            aria-label={
              copied
                ? t("generated.dashboard.settings.keyCopied")
                : t("generated.dashboard.settings.copyCode")
            }
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
          {t("generated.dashboard.settings.generated2", {
            value0: authenticatorSetupData?.issuedAt ?? "—",
          })}
        </p>
      </div>
    </div>
  )
}

function CodeInputEntry({
  method,
  authenticatorSetupData,
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
  authenticatorSetupData: AuthenticatorSetupData | null
  code: string
  resendCooldown: number
  isBusy: boolean
  canResend: boolean
  onCodeChange: (code: string) => void
  onResend: () => void
  onVerify: () => void
  userEmail?: string
}) {
  const t = useAppTranslations()

  const canSendCode = getResendMethod(method) !== null

  return (
    <div className="space-y-4">
      {method === "AUTHENTICATOR" ? (
        <AuthenticatorSetup
          authenticatorSetupData={authenticatorSetupData}
          userEmail={userEmail}
        />
      ) : (
        <div className="space-y-2">
          <p className="font-medium text-sm">
            {t("generated.dashboard.settings.oneTimeCode")}
          </p>
          <p className="text-muted-foreground text-sm">
            {t("generated.dashboard.settings.eMailCodeBeenSent")}
          </p>
          <p className="text-muted-foreground text-xs">
            {t("generated.dashboard.settings.requestResendCodeArrived")}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="two-factor-code">
          {t("generated.shared.verificationCode")}
        </Label>
        <OtpInput id="two-factor-code" onChange={onCodeChange} value={code} />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={code.length !== OTP_LENGTH}
            isLoading={isBusy}
            onClick={onVerify}
            type="button"
          >
            {t("generated.dashboard.settings.verifyActivate")}
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
    </div>
  )
}
function RecoveryCodesSection({ enabled }: { enabled: boolean }) {
  const t = useAppTranslations()

  const locale = useLocale()
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [isCodesDialogOpen, setIsCodesDialogOpen] = useState(false)

  const {
    data: codes,
    mutateAsync: handleGenerateCodes,
    isPending: isGeneratingCodes,
  } = useApiMutation({
    mutationFn: async () => {
      const codes = await apiFetch(
        "/api/2fa/backup-codes/generate",
        BackupCodesGenerateSchema,
        {
          method: "POST",
          body: null,
        }
      )
      return codes
    },
    onSuccess: (_, __, ___, context) => {
      setIsGenerateDialogOpen(false)
      setIsCodesDialogOpen(true)
      context.client.invalidateQueries({
        queryKey: LINKED_2FA_METHODS_QUERY_KEY,
      })
    },
  })

  const generatedCodes = codes ?? []

  const handleCodesDialogOpenChange = (open: boolean): void => {
    setIsCodesDialogOpen(open)
  }

  const handlePrintCodes = (): void => {
    if (generatedCodes.length === 0) {
      return
    }

    const printWindow = window.open("", "_blank", "width=720,height=900")

    if (!printWindow) {
      toast.error(t("generated.dashboard.settings.printPreviewFailedOpenCheck"))
      return
    }

    const generatedAt = new Date().toLocaleString(locale)
    const documentMarkup = getPrintableRecoveryCodesDocument(
      t,
      generatedCodes ?? [],
      generatedAt,
      locale
    )
    printWindow.document.write(documentMarkup)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium text-sm">
            {t("generated.dashboard.settings.recoveryCodes")}
          </p>
          <p className="text-muted-foreground text-sm">
            {t("generated.dashboard.settings.storeSafePlace")}
          </p>
        </div>
        <Button
          disabled={!enabled}
          onClick={() => setIsGenerateDialogOpen(true)}
          type="button"
          variant="outline"
        >
          {t("generated.dashboard.settings.generate")}
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        {enabled
          ? t("generated.dashboard.settings.generatingNewCodesWillInvalidate")
          : t("generated.dashboard.settings.enable2faGenerateCodes")}
      </p>

      <AlertDialog
        onOpenChange={setIsGenerateDialogOpen}
        open={isGenerateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-amber-500/10">
              <HugeiconsIcon
                className="text-amber-600 dark:text-amber-500"
                icon={Alert02Icon}
                size={24}
              />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {t("generated.dashboard.settings.generateNewRecoveryCodes")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("generated.dashboard.settings.previousCodesWillStopWorking")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGeneratingCodes}>
              {t("generated.shared.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              isLoading={isGeneratingCodes}
              onClick={async () => await handleGenerateCodes()}
            >
              {t("generated.dashboard.settings.generateNewCodes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        onOpenChange={handleCodesDialogOpenChange}
        open={isCodesDialogOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("generated.dashboard.settings.newRecoveryCodes")}
            </DialogTitle>
            <DialogDescription>
              {t("generated.dashboard.settings.writeDownNowKeepSafe")}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            aria-label={t("generated.dashboard.settings.recoveryCodes")}
            className="min-h-40 font-mono text-sm"
            readOnly
            value={generatedCodes.join("\n")}
          />

          <DialogFooter className="gap-2 sm:gap-2">
            <Button onClick={handlePrintCodes} type="button" variant="outline">
              {t("generated.dashboard.settings.printCodes")}
            </Button>
            <DialogClose render={<Button type="button" />}>
              {t("generated.dashboard.settings.close")}
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const t = useAppTranslations()

  if (status === "DISABLED" && !isSetupInProgress) {
    return (
      <Button
        disabled={!canStartSetup}
        isLoading={setupStage === "REQUESTING"}
        onClick={onStartSetup}
        type="button"
      >
        {t("generated.dashboard.settings.startSetup")}
      </Button>
    )
  }

  if (status === "ENABLED" && !isSetupInProgress) {
    return (
      <Button disabled={!canStartSetup} onClick={onStartSetup} type="button">
        {t("generated.dashboard.settings.addMethod")}
      </Button>
    )
  }

  if (status === "SETUP" || isSetupInProgress) {
    return (
      <Button onClick={onCancelSetup} type="button" variant="outline">
        {t("generated.dashboard.settings.cancelSetup")}
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
  isLinkedMethodsError,
  onRetryLinkedMethods,
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
  isLinkedMethodsError?: boolean
  onRetryLinkedMethods?: () => void
  onDefaultMethodChange: (method: TwoFactorMethod) => void
  isSettingDefault: boolean
  onRemoveMethod: (method: RemovableTwoFactorMethod) => void
  removingMethod: RemovableTwoFactorMethod | null
}) {
  const t = useAppTranslations()

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
    t,
    status,
    linkedMethods,
    hasAvailableMethods,
    isSelectedLinked,
  })

  return (
    <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="space-y-2">
        <p className="font-medium text-sm">
          {t("generated.dashboard.settings.combinedMethods2")}
        </p>
        <ConnectedMethods
          defaultMethod={defaultMethod}
          isError={isLinkedMethodsError}
          isLoading={isLinkedMethodsLoading}
          isSettingDefault={isSettingDefault}
          linkedMethods={linkedMethods}
          onDefaultMethodChange={onDefaultMethodChange}
          onRemoveMethod={onRemoveMethod}
          onRetry={onRetryLinkedMethods}
          removingMethod={removingMethod}
        />
      </div>
      {hasAvailableMethods && !isLinkedMethodsLoading ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">
                {t("generated.dashboard.settings.value2faSetup")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t(
                  "generated.dashboard.settings.addSecondVerificationStepProtect"
                )}
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
              <span>{t("generated.dashboard.settings.selectMethod")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isStepComplete(2, setupStage) ? "success" : "outline"}
              >
                2
              </Badge>
              <span>{t("generated.dashboard.settings.confirmCode")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isStepComplete(3, setupStage) ? "success" : "outline"}
              >
                3
              </Badge>
              <span>{t("generated.dashboard.settings.saveCodes")}</span>
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
  const t = useAppTranslations()

  const twoFactorMethodLabels = getTwoFactorMethodLabels()
  const {
    data: linkedMethods,
    isLoading: isLinkedMethodsLoading,
    isError: isLinkedMethodsError,
    refetch: refetchLinkedMethods,
  } = useLinkedMethods()

  const setDefaultMethodMutation = useSetDefaultMethod()
  const removeMethodMutation = useRemoveMethod()
  const [removingMethod, setRemovingMethod] =
    useState<RemovableTwoFactorMethod | null>(null)

  const handleDefaultMethodChange = (newDefaultMethod: TwoFactorMethod) => {
    setDefaultMethodMutation.mutate(newDefaultMethod, {
      onSuccess: () => {
        toast.success(
          t("generated.dashboard.settings.methodBeenSetDefault", {
            value0: twoFactorMethodLabels[newDefaultMethod],
          })
        )
      },
    })
  }

  const handleRemoveMethod = (methodToRemove: RemovableTwoFactorMethod) => {
    setRemovingMethod(methodToRemove)
    removeMethodMutation.mutate(methodToRemove, {
      onSuccess: () => {
        toast.success(
          t("generated.dashboard.settings.methodBeenRemoved", {
            value0: twoFactorMethodLabels[methodToRemove],
          })
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
      const available = getTwoFactorMethods().find(
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
  const { stage: setupStage, authenticatorSetupData, code, error } = setupState
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
        refetchLinkedMethods().catch(() => {
          toast.error(
            t("generated.dashboard.settings.failedRefresh2faMethodList")
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

  const handleVerifyCode = (verificationCode?: string): void => {
    verifySetup(verificationCode)
  }

  return (
    <div className="space-y-6">
      <TwoFactorConfigurationSection
        defaultMethod={linkedMethods?.defaultMethod}
        isLinkedMethodsError={isLinkedMethodsError}
        isLinkedMethodsLoading={isLinkedMethodsLoading}
        isSettingDefault={setDefaultMethodMutation.isPending}
        linkedMethods={linkedMethods?.methods}
        method={method}
        onCancelSetup={handleCancelSetup}
        onDefaultMethodChange={handleDefaultMethodChange}
        onMethodChange={onMethodChange}
        onRemoveMethod={handleRemoveMethod}
        onRetryLinkedMethods={() => refetchLinkedMethods()}
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
              <AlertTitle>
                {t("generated.dashboard.settings.connect2faService")}
              </AlertTitle>
              <AlertDescription>
                {t("generated.dashboard.settings.generateKeyPrepareNextSteps")}
              </AlertDescription>
            </Alert>
          ) : null}

          {setupStage === "SENDING" ? (
            <Alert>
              <Spinner className="text-muted-foreground" />
              <AlertTitle>
                {t("generated.dashboard.settings.sendCode")}
              </AlertTitle>
              <AlertDescription>
                {t("generated.dashboard.settings.codeGoesSelectedMethod")}
              </AlertDescription>
            </Alert>
          ) : null}

          {setupStage === "ERROR" && error ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t("generated.dashboard.settings.value2faFailedActivate")}
              </AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {showCodeEntry ? (
            <CodeInputEntry
              authenticatorSetupData={authenticatorSetupData}
              canResend={canResendCode}
              code={code}
              isBusy={setupStage === "VERIFYING"}
              method={method}
              onCodeChange={(nextCode) => {
                dispatch({ type: "set_code", code: nextCode })
                const shouldAutoSubmit =
                  nextCode.length === OTP_LENGTH && !isBusy

                if (shouldAutoSubmit) {
                  handleVerifyCode(nextCode)
                }
              }}
              onResend={handleResendCode}
              onVerify={handleVerifyCode}
              resendCooldown={resendCooldown}
              userEmail={userEmail}
            />
          ) : null}
        </div>
      ) : null}

      <div className="h-px bg-border" />

      <RecoveryCodesSection enabled={enabled} />
    </div>
  )
}
