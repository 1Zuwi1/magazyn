"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  type PasswordVerificationCopy,
  PasswordVerificationSection,
} from "./password-verification-section"
import type { TwoFactorMethod } from "./types"

interface TwoFactorVerificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  method: TwoFactorMethod
  code: string
  onCodeChange: (code: string) => void
  onVerificationChange?: (complete: boolean) => void
  onVerified?: () => void
  autoClose?: boolean
  title?: string
  contentClassName?: string
  copy?: PasswordVerificationCopy
}

export function TwoFactorVerificationDialog({
  open,
  onOpenChange,
  method,
  code,
  onCodeChange,
  onVerificationChange,
  onVerified,
  autoClose = true,
  title,
  contentClassName = "sm:max-w-lg",
  copy,
}: TwoFactorVerificationDialogProps) {
  const handleVerificationChange = (complete: boolean) => {
    onVerificationChange?.(complete)

    if (!complete) {
      return
    }

    if (autoClose) {
      onOpenChange(false)
    }

    onVerified?.()
  }

  const resolvedTitle = title ?? copy?.title ?? "Potwierdź 2FA przed zmianą"

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
        </DialogHeader>
        <PasswordVerificationSection
          code={code}
          copy={copy}
          method={method}
          onInputChange={onCodeChange}
          onVerificationChange={handleVerificationChange}
        />
      </DialogContent>
    </Dialog>
  )
}
