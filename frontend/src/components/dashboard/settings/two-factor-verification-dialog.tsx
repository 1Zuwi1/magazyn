"use client"

import {
  Key01Icon,
  Mail01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { apiFetch } from "@/lib/fetcher"
import { Check2FASchema, type TwoFactorMethod } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { TWO_FACTOR_METHODS } from "./constants"
import {
  type PasswordVerificationCopy,
  PasswordVerificationSection,
} from "./password-verification-section"

interface TwoFactorVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMethod?: TwoFactorMethod
  availableMethods?: TwoFactorMethod[]
  onVerified?: () => void
  autoClose?: boolean
  title?: string
  contentClassName?: string
  copy?: PasswordVerificationCopy
}

const METHOD_ICONS: Record<TwoFactorMethod, typeof Key01Icon> = {
  AUTHENTICATOR: Key01Icon,
  SMS: SmartPhone01Icon,
  EMAIL: Mail01Icon,
}

export function TwoFactorVerificationDialog({
  open,
  onOpenChange,
  initialMethod,
  availableMethods,
  onVerified,
  autoClose = true,
  title,
  contentClassName = "sm:max-w-lg",
  copy,
}: TwoFactorVerificationDialogProps) {
  const [code, setCode] = useState("")
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>(
    initialMethod ?? "AUTHENTICATOR"
  )
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState("")

  const methodOptions = useMemo(
    () =>
      availableMethods?.length
        ? TWO_FACTOR_METHODS.filter((method) =>
            availableMethods.includes(method.value as TwoFactorMethod)
          )
        : TWO_FACTOR_METHODS,
    [availableMethods]
  )
  const hasInitialMethod = initialMethod
    ? methodOptions.some((method) => method.value === initialMethod)
    : false
  const defaultMethod =
    (hasInitialMethod ? initialMethod : undefined) ??
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
    } catch {
      const message = "Kod jest nieprawidłowy. Spróbuj ponownie."
      setIsVerified(false)
      setVerificationError(message)
      toast.error(message)
    } finally {
      setIsVerifying(false)
    }
  }

  const resolvedTitle = title ?? copy?.title ?? "Potwierdź 2FA przed zmianą"
  const resolvedDescription =
    "To dodatkowy krok bezpieczeństwa. Wpisz kod, aby kontynuować."

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
        <PasswordVerificationSection
          autoVerify
          code={code}
          copy={copy}
          isVerified={isVerified}
          isVerifying={isVerifying}
          method={selectedMethod}
          onInputChange={(value) => {
            setCode(value)
            if (verificationError) {
              setVerificationError("")
            }
          }}
          onVerify={handleVerify}
          showTitle={false}
          verificationError={verificationError}
        />
      </DialogContent>
    </Dialog>
  )
}
