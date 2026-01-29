"use client"

import {
  LockPasswordIcon,
  Mail01Icon,
  Shield01Icon,
  User03Icon,
} from "@hugeicons/core-free-icons"
import { useForm } from "@tanstack/react-form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { FieldWithState } from "@/components/helpers/field-state"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { apiFetch } from "@/lib/fetcher"
import { FormRegisterSchema, LoginSchema, RegisterSchema } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"
import { getAnimationStyle } from "@/lib/utils"

type AuthMode = "login" | "register"

interface AuthFormProps {
  mode: AuthMode
}

const values = {
  login: {
    email: "",
    password: "",
  },
  register: {
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  },
}

type ValueTypes = typeof values

function AuthCardDecoration() {
  return (
    <>
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
    </>
  )
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const isLogin = mode === "login"

  const form = useForm({
    defaultValues: values[mode],
    onSubmit: async ({ value }) => {
      if (isLogin) {
        const loginValue = value as ValueTypes["login"]
        const [err, res] = await tryCatch(
          apiFetch("/api/auth/login", LoginSchema, {
            method: "POST",
            body: loginValue,
          })
        )

        if (err) {
          handleApiError(
            err,
            "Wystąpił błąd podczas logowania. Spróbuj ponownie."
          )
          return
        }

        toast.success("Zalogowano pomyślnie!")
        router.push(res.requiresTwoFactor ? "/login/2fa" : "/dashboard")
      } else {
        const { confirmPassword, ...registerValue } =
          value as ValueTypes["register"]
        const [err] = await tryCatch(
          apiFetch("/api/auth/register", RegisterSchema, {
            method: "POST",
            body: registerValue,
          })
        )

        if (err) {
          handleApiError(
            err,
            "Wystąpił błąd podczas rejestracji. Spróbuj ponownie."
          )
          return
        }

        toast.success("Zarejestrowano pomyślnie! Możesz się teraz zalogować.")
        router.push("/login")
      }
    },
    validators: {
      onSubmitAsync: isLogin
        ? LoginSchema.shape.POST.shape.input
        : FormRegisterSchema,
    },
  })

  return (
    <div className="fade-in slide-in-from-bottom-4 relative animate-in duration-500">
      {/* Background glow */}
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-linear-to-b from-primary/5 via-transparent to-transparent blur-2xl" />

      {/* Card container */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-8 shadow-black/5 shadow-xl backdrop-blur-xl">
        <AuthCardDecoration />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            {/* Header */}
            <div
              className="fade-in flex animate-in flex-col items-center gap-3 text-center duration-500"
              style={getAnimationStyle("100ms")}
            >
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-primary/10 blur-lg" />
                <Logo className="relative" />
              </div>
              <FieldDescription className="mt-2 max-w-70 text-muted-foreground/80">
                {isLogin
                  ? "Wprowadź swój adres email i hasło, aby uzyskać dostęp do konta."
                  : "Utwórz konto, aby korzystać z aplikacji."}
              </FieldDescription>
            </div>
            <div
              className="fade-in mt-2 animate-in space-y-4 duration-500"
              style={getAnimationStyle("200ms")}
            >
              <form.Field name="email">
                {(field) => (
                  <FieldWithState
                    field={field}
                    icon={Mail01Icon}
                    label="Email"
                    placeholder="jan@kowalski.pl"
                    type="email"
                  />
                )}
              </form.Field>
              {!isLogin && (
                <form.Field name="fullName">
                  {(field) => (
                    <FieldWithState
                      field={field}
                      icon={User03Icon}
                      label="Pełne imię i nazwisko"
                      placeholder="Jan Kowalski"
                      type="text"
                    />
                  )}
                </form.Field>
              )}

              <form.Field name="password">
                {(field) => {
                  return (
                    <FieldWithState
                      field={field}
                      icon={LockPasswordIcon}
                      label="Hasło"
                      placeholder="••••••••"
                      type="password"
                    />
                  )
                }}
              </form.Field>

              {!isLogin && (
                <form.Field name="confirmPassword">
                  {(field) => (
                    <FieldWithState
                      field={field}
                      icon={Shield01Icon}
                      label="Potwierdź hasło"
                      placeholder="••••••••"
                      type="password"
                    />
                  )}
                </form.Field>
              )}

              <Field>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      className="w-full"
                      disabled={!canSubmit}
                      isLoading={isSubmitting}
                      size="lg"
                      type="submit"
                    >
                      {isLogin ? "Zaloguj się" : "Zarejestruj się"}
                    </Button>
                  )}
                </form.Subscribe>
              </Field>

              <div className="text-center text-sm">
                {isLogin ? (
                  <>
                    Nie masz konta?{" "}
                    <Link className="text-primary underline" href="/register">
                      Zarejestruj się
                    </Link>
                  </>
                ) : (
                  <>
                    Masz już konto?{" "}
                    <Link className="text-primary underline" href="/login">
                      Zaloguj się
                    </Link>
                  </>
                )}
              </div>
            </div>
          </FieldGroup>
        </form>
      </div>
      <div className="pointer-events-none absolute -bottom-2 left-1/2 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  )
}
