"use client"

import { useForm } from "@tanstack/react-form"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { ZodError } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChangePasswordFormSchema } from "@/lib/schemas"
import { PasswordVerificationSection } from "./password-verification-section"
import type { TwoFactorMethod } from "./types"
import { wait } from "./utils"

function FieldErrorMessage({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <p className="text-destructive text-xs" role="alert">
      {message}
    </p>
  )
}

interface PasswordSectionProps {
  verificationRequired: boolean
  twoFactorMethod: TwoFactorMethod
}

export function PasswordSection({
  verificationRequired,
  twoFactorMethod,
}: PasswordSectionProps) {
  const [verificationComplete, setVerificationComplete] = useState(
    !verificationRequired
  )
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    useState(false)

  useEffect(() => {
    setVerificationComplete(!verificationRequired)
  }, [verificationRequired])

  const verificationBlocked = verificationRequired && !verificationComplete

  const form = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      twoFactorCode: "",
    },
    onSubmit: async ({ value }) => {
      if (verificationBlocked && !value.twoFactorCode) {
        setIsVerificationDialogOpen(true)
        return
      }

      try {
        await wait(1000)
        form.reset()
        toast.success("Hasło zostało zmienione.")
      } catch {
        toast.error("Nie udało się zmienić hasła. Spróbuj ponownie.")
      }
    },
    validators: {
      onSubmitAsync: ChangePasswordFormSchema,
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field name="oldPassword">
          {(field) => {
            const errorMessage = (field.state.meta.errors[0] ||
              null) as ZodError | null
            return (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="current-password">Obecne hasło</Label>
                <Input
                  aria-invalid={!!errorMessage}
                  autoComplete="current-password"
                  className={errorMessage ? "border-destructive" : ""}
                  id="current-password"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Wprowadź obecne hasło"
                  type="password"
                  value={field.state.value}
                />
                <FieldErrorMessage message={errorMessage?.message || null} />
              </div>
            )
          }}
        </form.Field>
        <form.Field name="newPassword">
          {(field) => {
            const errorMessage = (field.state.meta.errors[0] ||
              null) as ZodError | null
            return (
              <div className="space-y-2">
                <Label htmlFor="new-password">Nowe hasło</Label>
                <Input
                  aria-invalid={!!errorMessage}
                  autoComplete="new-password"
                  className={errorMessage ? "border-destructive" : ""}
                  id="new-password"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Co najmniej 8 znaków"
                  type="password"
                  value={field.state.value}
                />
                <FieldErrorMessage message={errorMessage?.message || null} />
              </div>
            )
          }}
        </form.Field>
        <form.Field name="confirmPassword">
          {(field) => {
            const errorMessage = (field.state.meta.errors[0] ||
              null) as ZodError | null

            return (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Potwierdź hasło</Label>
                <Input
                  aria-invalid={!!errorMessage}
                  autoComplete="new-password"
                  className={errorMessage ? "border-destructive" : ""}
                  id="confirm-password"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Powtórz nowe hasło"
                  type="password"
                  value={field.state.value}
                />
                <FieldErrorMessage message={errorMessage?.message || null} />
              </div>
            )
          }}
        </form.Field>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          Min. 8 znaków, w tym cyfry, znaki specjalne, małe i wielkie litery.
        </p>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              disabled={!canSubmit}
              isLoading={isSubmitting}
              type="submit"
            >
              Zmień hasło
            </Button>
          )}
        </form.Subscribe>
      </div>
      {verificationRequired ? (
        <Dialog
          onOpenChange={setIsVerificationDialogOpen}
          open={isVerificationDialogOpen}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Potwierdź 2FA przed zmianą</DialogTitle>
            </DialogHeader>
            <form.Field name="twoFactorCode">
              {(field) => (
                <PasswordVerificationSection
                  code={field.state.value}
                  method={twoFactorMethod}
                  onInputChange={(code) => field.handleChange(code)}
                  onVerificationChange={(complete) => {
                    setVerificationComplete(complete)
                    if (complete) {
                      setIsVerificationDialogOpen(false)
                      form.handleSubmit()
                    }
                  }}
                />
              )}
            </form.Field>
          </DialogContent>
        </Dialog>
      ) : null}
    </form>
  )
}
