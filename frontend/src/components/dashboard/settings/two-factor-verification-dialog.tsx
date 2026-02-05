"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import PasskeyLogin from "@/app/(auth)/components/passkey-login"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import useLinkedMethods from "@/hooks/use-linked-methods"
import { apiFetch, FetchError } from "@/lib/fetcher"
import {
  Check2FASchema,
  Resend2FASchema,
  ResendMethods,
  type TwoFactorMethod,
} from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { METHOD_ICONS, TWO_FACTOR_METHODS } from "./constants"
import {
  type PasswordVerificationCopy,
  PasswordVerificationSection,
} from "./password-verification-section"

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
  const [code, setCode] = useState("")
  const { data: methods } = useLinkedMethods()
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
      return "Wpisz kod z aplikacji uwierzytelniającej."
    }
    if (method === "PASSKEYS") {
      return "Potwierdź przy użyciu klucza bezpieczeństwa."
    }
    return "Wyślemy jednorazowy kod na wybraną metodę."
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

  const methodOptions = useMemo(
    () =>
      methods?.methods?.length
        ? TWO_FACTOR_METHODS.filter((method) =>
            methods?.methods.includes(method.value as TwoFactorMethod)
          )
        : TWO_FACTOR_METHODS,
    [methods?.methods]
  )
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

  const handleRequestCode = async (method: TwoFactorMethod): Promise<void> => {
    const validatedMethod = ResendMethods.safeParse(method)
    if (validatedMethod.success === false) {
      return
    }

    await apiFetch("/api/2fa/send", Resend2FASchema, {
      method: "POST",
      body: { method: validatedMethod.data },
    })
  }

  const handleVerify = async (value: string): Promise<void> => {
    if (isVerifying) {
      return
    }

    setIsVerifying(true)
    setVerificationError("")
    try {
      await apiFetch("/api/2fa/check", Check2FASchema, {
        method: "POST",
        body: { code: value, method: selectedMethod },
      })

      setIsVerified(true)
      if (autoClose) {
        onOpenChange(false)
      }

      onVerified?.()
    } catch (e) {
      const message = FetchError.isError(e)
        ? e.message
        : "Kod jest nieprawidłowy. Spróbuj ponownie."
      setIsVerified(false)
      setVerificationError(message)
      toast.error(message)
    } finally {
      setIsVerifying(false)
    }
  }

  const resolvedTitle = title ?? copy?.title ?? "Potwierdź 2FA przed zmianą"
  const resolvedDescription =
    "To dodatkowy krok bezpieczeństwa. Potwierdź swoją tożsamość, aby kontynuować."
  const passkeyDescription =
    typeof resolvedCopy.description === "function"
      ? resolvedCopy.description({ method: "PASSKEYS" })
      : resolvedCopy.description
  const passkeyVerifiedTitle = copy?.verifiedTitle ?? "Zweryfikowano"
  const passkeyVerifiedDescription =
    copy?.verifiedDescription ?? "Możesz bezpiecznie kontynuować."

  const handlePasskeyVerified = () => {
    setIsVerified(true)
    if (autoClose) {
      onOpenChange(false)
    }
    onVerified?.()
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
            Metoda weryfikacji
          </Label>
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
        </div>
        {selectedMethod === "PASSKEYS" ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
                  {passkeyDescription}
                </p>
              </div>
              <Badge variant={isVerified ? "success" : "warning"}>
                {isVerified ? "Zweryfikowano" : "Wymagane"}
              </Badge>
            </div>
            {isVerified ? (
              <Alert>
                <AlertTitle>{passkeyVerifiedTitle}</AlertTitle>
                <AlertDescription>
                  {passkeyVerifiedDescription}
                </AlertDescription>
              </Alert>
            ) : (
              <PasskeyLogin
                label="Zweryfikuj kluczem bezpieczeństwa"
                onSuccess={handlePasskeyVerified}
                redirectTo={null}
                showSeparator={false}
                showSuccessToast={false}
              />
            )}
          </div>
        ) : (
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
            onRequestCode={handleRequestCode}
            onVerify={handleVerify}
            showTitle={false}
            verificationError={verificationError}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
