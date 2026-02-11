"use client"

import { useEffect } from "react"
import { useShallow } from "zustand/react/shallow"
import { TwoFactorVerificationDialog } from "./two-factor-verification-dialog"
import { useTwoFactorVerificationDialogStore } from "./two-factor-verification-dialog-store"

export function TwoFactorVerificationDialogRoot() {
  const { isOpen, options, close } = useTwoFactorVerificationDialogStore(
    useShallow((state) => ({
      isOpen: state.isOpen,
      options: state.options,
      close: state.close,
    }))
  )

  useEffect(() => {
    return () => {
      close()
    }
  }, [close])

  if (!isOpen) {
    return null
  }

  return (
    <TwoFactorVerificationDialog
      autoClose={options.autoClose}
      contentClassName={options.contentClassName}
      copy={options.copy}
      onOpenChange={(open) => {
        if (!open) {
          close()
        }
      }}
      onVerified={options.onVerified}
      open={isOpen}
      title={options.title}
    />
  )
}
