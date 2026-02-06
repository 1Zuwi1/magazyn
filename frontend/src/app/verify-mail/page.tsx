"use client"

import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { apiFetch } from "@/lib/fetcher"
import { VerifyMailSchema } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"
import { getAnimationStyle } from "@/lib/utils"

type VerificationState = "loading" | "success" | "error"

function VerifyMailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [state, setState] = useState<VerificationState>("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setState("error")
      setErrorMessage("Brak tokenu weryfikacyjnego w adresie URL.")
      return
    }

    const verify = async () => {
      const [err] = await tryCatch(
        apiFetch("/api/auth/verify-email", VerifyMailSchema, {
          method: "POST",
          body: { token },
        })
      )

      if (err) {
        setState("error")
        setErrorMessage(
          err.message || "Wystąpił błąd podczas weryfikacji. Spróbuj ponownie."
        )
        return
      }

      setState("success")
    }

    verify()
  }, [token])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="fade-in slide-in-from-bottom-4 relative animate-in duration-500">
          {/* Background glow */}
          <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-linear-to-b from-primary/5 via-transparent to-transparent blur-2xl" />

          {/* Card */}
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 shadow-black/5 shadow-xl">
            {/* Corner accents */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 h-16 w-16"
            >
              <div className="absolute top-3 left-3 h-px w-6 bg-linear-to-r from-primary/40 to-transparent" />
              <div className="absolute top-3 left-3 h-6 w-px bg-linear-to-b from-primary/40 to-transparent" />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-0 h-16 w-16"
            >
              <div className="absolute top-3 right-3 h-px w-6 bg-linear-to-l from-primary/40 to-transparent" />
              <div className="absolute top-3 right-3 h-6 w-px bg-linear-to-b from-primary/40 to-transparent" />
            </div>

            <div className="flex flex-col items-center gap-6 text-center">
              {/* Logo */}
              <div
                className="fade-in animate-in duration-500"
                style={getAnimationStyle("100ms")}
              >
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-primary/10 blur-lg" />
                  <Logo className="relative" />
                </div>
              </div>

              {/* State icon */}
              <div
                className="fade-in animate-in duration-500"
                style={getAnimationStyle("200ms")}
              >
                {state === "loading" && <LoadingState />}
                {state === "success" && <SuccessState />}
                {state === "error" && <ErrorState message={errorMessage} />}
              </div>

              {/* Action button */}
              {state !== "loading" && (
                <div
                  className="fade-in w-full animate-in duration-500"
                  style={getAnimationStyle("300ms")}
                >
                  <Link className="block" href="/login">
                    <Button className="w-full" size="lg">
                      {state === "success"
                        ? "Przejdź do logowania"
                        : "Wróć do logowania"}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="pointer-events-none absolute -bottom-2 left-1/2 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex size-16 items-center justify-center">
        {/* Animated ring */}
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <HugeiconsIcon className="size-7 text-primary" icon={Mail01Icon} />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-semibold text-lg">Weryfikacja adresu e-mail</h1>
        <p className="text-muted-foreground text-sm">
          Proszę czekać, trwa weryfikacja Twojego adresu e-mail...
        </p>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Spinner className="size-3" />
        <span>Przetwarzanie</span>
      </div>
    </div>
  )
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
        <HugeiconsIcon
          className="size-8 text-emerald-500"
          icon={CheckmarkCircle02Icon}
        />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-semibold text-lg">E-mail zweryfikowany</h1>
        <p className="text-muted-foreground text-sm">
          Twój adres e-mail został pomyślnie zweryfikowany. Możesz teraz
          zalogować się na swoje konto.
        </p>
      </div>
      <div className="w-full rounded-lg bg-emerald-500/5 p-3 ring-1 ring-emerald-500/20">
        <p className="text-emerald-600 text-xs dark:text-emerald-400">
          Weryfikacja zakończona pomyślnie. Twoje konto jest teraz aktywne.
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <HugeiconsIcon
          className="size-8 text-destructive"
          icon={Cancel01Icon}
        />
      </div>
      <div className="space-y-1.5">
        <h1 className="font-semibold text-lg">Weryfikacja nieudana</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
      <div className="w-full rounded-lg bg-destructive/5 p-3 ring-1 ring-destructive/20">
        <p className="text-destructive text-xs">
          Jeśli problem się powtarza, skontaktuj się z administratorem lub
          spróbuj zarejestrować się ponownie.
        </p>
      </div>
    </div>
  )
}

export default function VerifyMailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Spinner className="size-6" />
        </div>
      }
    >
      <VerifyMailContent />
    </Suspense>
  )
}
