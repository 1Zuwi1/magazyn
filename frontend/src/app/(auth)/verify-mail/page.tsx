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
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { apiFetch } from "@/lib/fetcher"
import { VerifyMailSchema } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"
import { getAnimationStyle } from "@/lib/utils"
import AuthCard from "../components/auth-card"

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

    const abortController = new AbortController()

    const verify = async () => {
      const [err] = await tryCatch(
        apiFetch("/api/auth/verify-email", VerifyMailSchema, {
          method: "POST",
          body: { token },
          signal: abortController.signal,
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
    <AuthCard>
      <div className="grid gap-4">
        {/* State icon */}
        <div
          className="fade-in animate-in text-center duration-500"
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
    </AuthCard>
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
