"use client"

import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { ZodError } from "zod"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { apiFetch } from "@/lib/fetcher"
import { FormRegisterSchema, LoginSchema, RegisterSchema } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"

type AuthMode = "login" | "register"

interface AuthFormProps {
  mode: AuthMode
}

function FieldState({ field }: { field: AnyFieldApi }) {
  const error = field.state.meta.errors[0] as ZodError | string | undefined

  return error ? (
    <p className="fade-in slide-in-from-top-1 mt-1.5 flex animate-in items-center gap-1.5 text-red-500 text-xs duration-200">
      <svg
        className="h-3.5 w-3.5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
      <span className="text-wrap">
        {typeof error === "string" ? error : error.message}
      </span>
    </p>
  ) : null
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
      <div className="pointer-events-none absolute top-0 left-0 h-16 w-16">
        <div className="absolute top-3 left-3 h-px w-6 bg-gradient-to-r from-primary/40 to-transparent" />
        <div className="absolute top-3 left-3 h-6 w-px bg-gradient-to-b from-primary/40 to-transparent" />
      </div>
      <div className="pointer-events-none absolute top-0 right-0 h-16 w-16">
        <div className="absolute top-3 right-3 h-px w-6 bg-gradient-to-l from-primary/40 to-transparent" />
        <div className="absolute top-3 right-3 h-6 w-px bg-gradient-to-b from-primary/40 to-transparent" />
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
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-2xl" />

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
              style={{
                animationDelay: "100ms",
                animationFillMode: "backwards",
              }}
            >
              <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-primary/10 blur-lg" />
                <Logo className="relative" />
              </div>
              <FieldDescription className="mt-2 max-w-[280px] text-muted-foreground/80">
                {isLogin
                  ? "Wprowadź swój adres email i hasło, aby uzyskać dostęp do konta."
                  : "Utwórz konto, aby korzystać z aplikacji."}
              </FieldDescription>
            </div>

            {/* Form fields */}
            <div
              className="fade-in mt-2 animate-in space-y-4 duration-500"
              style={{
                animationDelay: "200ms",
                animationFillMode: "backwards",
              }}
            >
              <form.Field name="email">
                {(field) => (
                  <Field>
                    <FieldLabel
                      className="font-medium text-foreground/80 text-xs uppercase tracking-wide"
                      htmlFor={field.name}
                    >
                      Email
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        className={`h-11 bg-background/50 pl-10 transition-all duration-200 focus:bg-background ${
                          field.state.meta.errors.length
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-border/50 focus:border-primary/50"
                        }`}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="jan@kowalski.pl"
                        type="email"
                        value={field.state.value}
                      />
                      <svg
                        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <rect height="16" rx="2" width="20" x="2" y="4" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <FieldState field={field} />
                  </Field>
                )}
              </form.Field>

              {!isLogin && (
                <form.Field name="fullName">
                  {(field) => (
                    <Field>
                      <FieldLabel
                        className="font-medium text-foreground/80 text-xs uppercase tracking-wide"
                        htmlFor={field.name}
                      >
                        Pełne imię i nazwisko
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          className={`h-11 bg-background/50 pl-10 transition-all duration-200 focus:bg-background ${
                            field.state.meta.errors.length
                              ? "border-red-500/50 focus:border-red-500"
                              : "border-border/50 focus:border-primary/50"
                          }`}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Jan Kowalski"
                          type="text"
                          value={field.state.value}
                        />
                        <svg
                          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <FieldState field={field} />
                    </Field>
                  )}
                </form.Field>
              )}

              <form.Field name="password">
                {(field) => (
                  <Field>
                    <FieldLabel
                      className="font-medium text-foreground/80 text-xs uppercase tracking-wide"
                      htmlFor={field.name}
                    >
                      Hasło
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        className={`h-11 bg-background/50 pl-10 transition-all duration-200 focus:bg-background ${
                          field.state.meta.errors.length
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-border/50 focus:border-primary/50"
                        }`}
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="••••••••"
                        type="password"
                        value={field.state.value}
                      />
                      <svg
                        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          height="11"
                          rx="2"
                          ry="2"
                          width="18"
                          x="3"
                          y="11"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <FieldState field={field} />
                  </Field>
                )}
              </form.Field>

              {!isLogin && (
                <form.Field name="confirmPassword">
                  {(field) => (
                    <Field>
                      <FieldLabel
                        className="font-medium text-foreground/80 text-xs uppercase tracking-wide"
                        htmlFor={field.name}
                      >
                        Potwierdź hasło
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          className={`h-11 bg-background/50 pl-10 transition-all duration-200 focus:bg-background ${
                            field.state.meta.errors.length
                              ? "border-red-500/50 focus:border-red-500"
                              : "border-border/50 focus:border-primary/50"
                          }`}
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="••••••••"
                          type="password"
                          value={field.state.value}
                        />
                        <svg
                          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <FieldState field={field} />
                    </Field>
                  )}
                </form.Field>
              )}
            </div>

            {/* Submit button */}
            <div
              className="fade-in mt-6 animate-in duration-500"
              style={{
                animationDelay: "300ms",
                animationFillMode: "backwards",
              }}
            >
              <Field>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      className="group relative h-11 w-full overflow-hidden shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:shadow-xl"
                      disabled={!canSubmit}
                      isLoading={isSubmitting}
                      type="submit"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {isLogin ? "Zaloguj się" : "Zarejestruj się"}
                        {!isSubmitting && (
                          <svg
                            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        )}
                      </span>
                    </Button>
                  )}
                </form.Subscribe>
              </Field>
            </div>

            {/* Footer links */}
            <div
              className="fade-in mt-6 animate-in space-y-3 text-center text-sm duration-500"
              style={{
                animationDelay: "400ms",
                animationFillMode: "backwards",
              }}
            >
              {isLogin ? (
                <p className="text-muted-foreground">
                  Nie masz konta?{" "}
                  <Link
                    className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                    href="/register"
                  >
                    Zarejestruj się
                  </Link>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Masz już konto?{" "}
                  <Link
                    className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                    href="/login"
                  >
                    Zaloguj się
                  </Link>
                </p>
              )}

              <Link
                className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                href="/"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Powrót do strony głównej
              </Link>
            </div>
          </FieldGroup>
        </form>
      </div>

      {/* Bottom decoration */}
      <div className="pointer-events-none absolute -bottom-2 left-1/2 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  )
}
