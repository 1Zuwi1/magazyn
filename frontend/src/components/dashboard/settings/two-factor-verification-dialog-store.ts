"use client"

import { create } from "zustand"
import type { PasswordVerificationCopy } from "./password-verification-section"

export interface TwoFactorVerificationDialogOptions {
  onVerified?: () => void
  autoClose?: boolean
  title?: string
  contentClassName?: string
  copy?: PasswordVerificationCopy
}

interface TwoFactorVerificationDialogState {
  isOpen: boolean
  options: TwoFactorVerificationDialogOptions
  open: (options?: TwoFactorVerificationDialogOptions) => void
  close: () => void
}

const emptyOptions: TwoFactorVerificationDialogOptions = {}

export const useTwoFactorVerificationDialogStore =
  create<TwoFactorVerificationDialogState>((set) => ({
    isOpen: false,
    options: emptyOptions,
    open: (options) =>
      set({
        isOpen: true,
        options: options ?? emptyOptions,
      }),
    close: () => set({ isOpen: false, options: emptyOptions }),
  }))

export const useTwoFactorVerificationDialog = () => {
  const open = useTwoFactorVerificationDialogStore((state) => state.open)
  const close = useTwoFactorVerificationDialogStore((state) => state.close)

  return { open, close }
}
