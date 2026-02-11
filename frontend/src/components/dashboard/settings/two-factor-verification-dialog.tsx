"use client"

import { Alert02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useState } from "react"
import PasskeyLogin from "@/app/[locale]/(auth)/components/passkey-login"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useCheck2FA, useRequestTwoFactorCode } from "@/hooks/use-2fa"
import useLinkedMethods from "@/hooks/use-linked-methods"
import { useAppTranslations } from "@/i18n/use-translations"
import type { TwoFactorMethod } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { translateErrorCode } from "../utils/helpers"
import { getTwoFactorMethods, METHOD_ICONS } from "./constants"
import {
  type PasswordVerificationCopy,
  PasswordVerificationSection,
} from "./password-verification-section"

interface BackupCodeVerificationSectionProps {
  code: string
  description: string
  isVerified: boolean
  isVerifying: boolean
  verificationError: string
  verifiedTitle: string
  verifiedDescription: string
  onCodeChange: (value: string) => void
  onVerify: (code: string) => void
}

function BackupCodeVerificationSection({
  code,
  description,
  isVerified,
  isVerifying,
  verificationError,
  verifiedTitle,
  verifiedDescription,
  onCodeChange,
  onVerify,
}: BackupCodeVerificationSectionProps) {
  const t = useAppTranslations()

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <Badge variant={isVerified ? "success" : "warning"}>
          {isVerified
            ? t("generated.dashboard.settings.verified3")
            : t("generated.dashboard.settings.required")}
        </Badge>
      </div>
      {isVerified ? (
        <Alert>
          <AlertTitle>{verifiedTitle}</AlertTitle>
          <AlertDescription>{verifiedDescription}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {verificationError ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t("generated.dashboard.settings.verified")}
              </AlertTitle>
              <AlertDescription>{verificationError}</AlertDescription>
            </Alert>
          ) : null}
          <Label htmlFor="backup-code-input">
            {t("generated.auth.recoveryCode")}
          </Label>
          <Input
            autoComplete="off"
            autoFocus
            className="font-mono tracking-widest"
            disabled={isVerifying}
            id="backup-code-input"
            onChange={(e) => {
              onCodeChange(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && code.trim().length > 0) {
                e.preventDefault()
                onVerify(code)
              }
            }}
            placeholder={t("generated.auth.backupCodePlaceholder")}
            spellCheck={false}
            value={code}
          />
          <Button
            disabled={code.trim().length === 0 || isVerifying}
            isLoading={isVerifying}
            onClick={() => onVerify(code)}
            type="button"
          >
            {t("generated.shared.verifyCode")}
          </Button>
        </div>
      )}
    </div>
  )
}

interface TwoFactorVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified?: () => void
  autoClose?: boolean
  title?: string
  contentClassName?: string
  copy?: PasswordVerificationCopy
}

export function TwoFactorVerificationDialog({
  open,
  onOpenChange,
  onVerified,
  autoClose = true,
  title,
  contentClassName = "sm:max-w-lg",
  copy,
}: TwoFactorVerificationDialogProps) {
  const t = useAppTranslations()
  const [code, setCode] = useState("")
  const {
    data: methods,
    isPending: isMethodsPending,
    isError: isMethodsError,
  } = useLinkedMethods({
    enabled: open,
  })
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>(
    methods?.defaultMethod ?? "AUTHENTICATOR"
  )
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState("")

  const defaultDescription: PasswordVerificationCopy["description"] = ({
    method,
  }) => {
    if (method === "AUTHENTICATOR") {
      return t("generated.dashboard.settings.enterCodeAuthenticatorApp")
    }
    if (method === "PASSKEYS") {
      return t("generated.dashboard.settings.confirmSecurityKey")
    }
    if (method === "BACKUP_CODES") {
      return t("generated.dashboard.settings.enterBackupCodeToVerify")
    }
    return t("generated.dashboard.settings.willSendOneTimeCode")
  }

  const resolvedCopy: PasswordVerificationCopy = (() => {
    if (!copy) {
      return { description: defaultDescription }
    }
    if (copy.description) {
      return copy
    }
    return { ...copy, description: defaultDescription }
  })()

  const methodOptions = useMemo(() => {
    const twoFactorMethods = getTwoFactorMethods(t)
    if (methods?.methods?.length) {
      return twoFactorMethods.filter((method) =>
        methods.methods.includes(method.value as TwoFactorMethod)
      )
    }

    return twoFactorMethods
  }, [methods?.methods, t])
  const hasInitialMethod = methods?.defaultMethod
    ? methodOptions.some((method) => method.value === methods?.defaultMethod)
    : false
  const defaultMethod =
    (hasInitialMethod ? methods?.defaultMethod : undefined) ??
    (methodOptions[0]?.value as TwoFactorMethod | undefined) ??
    "AUTHENTICATOR"

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedMethod(defaultMethod)
    setCode("")
    setIsVerified(false)
    setIsVerifying(false)
    setVerificationError("")
  }, [defaultMethod, open])

  const { mutateAsync: requestCode } = useRequestTwoFactorCode()

  const { mutateAsync: verify } = useCheck2FA({
    onSuccess: () => {
      setIsVerified(true)
      if (autoClose) {
        onOpenChange(false)
      }

      onVerified?.()
    },
    onError: (e) => {
      setIsVerified(false)
      setVerificationError(translateErrorCode(t, e.message))
    },
    onSettled: () => {
      setIsVerifying(false)
    },
  })

  const handleVerify = async (value: string): Promise<void> => {
    if (isVerifying) {
      return
    }

    setIsVerifying(true)
    setVerificationError("")
    await verify({ value, selectedMethod })
  }

  const resolvedTitle =
    title ??
    copy?.title ??
    t("generated.dashboard.settings.confirm2faBeforeChanging")
  const resolvedDescription = t(
    "generated.dashboard.settings.additionalSecurityStepConfirmIdentity"
  )
  const passkeyDescription =
    typeof resolvedCopy.description === "function"
      ? resolvedCopy.description({ method: "PASSKEYS" })
      : resolvedCopy.description
  const passkeyVerifiedTitle =
    copy?.verifiedTitle ?? t("generated.dashboard.settings.verified3")
  const passkeyVerifiedDescription =
    copy?.verifiedDescription ??
    t("generated.dashboard.settings.safelyContinue")

  const handlePasskeyVerified = () => {
    setIsVerified(true)
    if (autoClose) {
      onOpenChange(false)
    }
    onVerified?.()
  }

  const backupCodeDescription =
    typeof resolvedCopy.description === "function"
      ? resolvedCopy.description({ method: "BACKUP_CODES" })
      : (resolvedCopy.description ??
        t("generated.dashboard.settings.enterBackupCodeToVerify"))
  const backupCodeVerifiedTitle =
    copy?.verifiedTitle ?? t("generated.dashboard.settings.verified3")
  const backupCodeVerifiedDescription =
    copy?.verifiedDescription ??
    t("generated.dashboard.settings.safelyContinue")

  const getInputContent = () => {
    if (isMethodsError || isMethodsPending) {
      return null
    }
    if (selectedMethod === "PASSKEYS") {
      return (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">
                {passkeyDescription}
              </p>
            </div>
            <Badge variant={isVerified ? "success" : "warning"}>
              {isVerified
                ? t("generated.dashboard.settings.verified3")
                : t("generated.dashboard.settings.required")}
            </Badge>
          </div>
          {isVerified ? (
            <Alert>
              <AlertTitle>{passkeyVerifiedTitle}</AlertTitle>
              <AlertDescription>{passkeyVerifiedDescription}</AlertDescription>
            </Alert>
          ) : (
            <PasskeyLogin
              label={t("generated.shared.verifySecurityKey")}
              onSuccess={handlePasskeyVerified}
              redirectTo={null}
              showSeparator={false}
              showSuccessToast={false}
            />
          )}
        </div>
      )
    }
    if (selectedMethod === "BACKUP_CODES") {
      return (
        <BackupCodeVerificationSection
          code={code}
          description={backupCodeDescription}
          isVerified={isVerified}
          isVerifying={isVerifying}
          onCodeChange={(value) => {
            setCode(value)
            if (verificationError) {
              setVerificationError("")
            }
          }}
          onVerify={handleVerify}
          verificationError={verificationError}
          verifiedDescription={backupCodeVerifiedDescription}
          verifiedTitle={backupCodeVerifiedTitle}
        />
      )
    }
    return (
      <PasswordVerificationSection
        autoVerify
        code={code}
        copy={resolvedCopy}
        isVerified={isVerified}
        isVerifying={isVerifying}
        method={selectedMethod}
        onInputChange={(value) => {
          setCode(value)
          if (verificationError) {
            setVerificationError("")
          }
        }}
        onRequestCode={requestCode}
        onVerify={handleVerify}
        showTitle={false}
        verificationError={verificationError}
      />
    )
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription>{resolvedDescription}</DialogDescription>
        </DialogHeader>
        <div className="@container space-y-2">
          <Label
            className="text-muted-foreground text-xs uppercase tracking-wide"
            id="verification-method-label"
          >
            {t("generated.dashboard.settings.verificationMethod")}
          </Label>
          {isMethodsPending && (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  key={`skeleton-${i.toString()}`}
                >
                  <Skeleton className="size-8 shrink-0 rounded-md" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          )}
          {!isMethodsPending && isMethodsError && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-destructive/20 border-dashed bg-destructive/5 px-4 py-4 text-center">
              <HugeiconsIcon
                className="text-destructive"
                icon={Alert02Icon}
                size={20}
              />
              <p className="font-medium text-foreground/80 text-sm">
                {t(
                  "generated.dashboard.settings.failedLoadVerificationMethods"
                )}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("generated.dashboard.settings.closeWindowAgain")}
              </p>
            </div>
          )}
          {!(isMethodsPending || isMethodsError) && (
            <RadioGroup
              aria-labelledby="verification-method-label"
              className={"grid gap-0"}
              onValueChange={(value) => {
                const nextMethod = value as TwoFactorMethod
                setSelectedMethod(nextMethod)
                setCode("")
                setIsVerified(false)
                setIsVerifying(false)
                setVerificationError("")
              }}
              value={selectedMethod}
            >
              {methodOptions.map((method) => {
                const isSelected = method.value === selectedMethod
                const Icon = METHOD_ICONS[method.value as TwoFactorMethod]

                return (
                  <div key={method.value}>
                    <RadioGroupItem
                      className="peer sr-only"
                      id={`verify-method-${method.value}`}
                      value={method.value}
                    />
                    <Label
                      className={cn(
                        "flex flex-1 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors",
                        isSelected
                          ? "border-primary/40 bg-primary/5 text-foreground"
                          : "border-muted bg-muted/20 text-muted-foreground hover:border-muted-foreground/40"
                      )}
                      htmlFor={`verify-method-${method.value}`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex size-8 items-center justify-center rounded-md border",
                            isSelected
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-muted bg-background text-muted-foreground"
                          )}
                        >
                          <HugeiconsIcon icon={Icon} size={16} />
                        </span>
                        <span className="font-medium text-sm">
                          {method.label}
                        </span>
                      </span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          )}
        </div>
        {getInputContent()}
      </DialogContent>
    </Dialog>
  )
}
