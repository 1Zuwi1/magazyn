"use client"

import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMemo } from "react"
import { toast } from "sonner"
import type { ZodError } from "zod"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useHandleApiError } from "@/hooks/use-handle-api-error"
import { apiFetch } from "@/lib/fetcher"
import { createAuthSchemas } from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"

type AuthMode = "login" | "register"

interface AuthFormProps {
  mode: AuthMode
}

function FieldState({ field }: { field: AnyFieldApi }) {
  const error = field.state.meta.errors[0] as ZodError | string | undefined

  return error ? (
    <p className="mt-1 text-wrap text-red-600 text-xs">
      {typeof error === "string" ? error : error.message}
    </p>
  ) : null
}

const values = {
  login: {
    username: "",
    password: "",
  },
  register: {
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  },
}

type ValueTypes = typeof values

export default function AuthForm({ mode }: AuthFormProps) {
  const translate = useTranslations("auth")
  const apiErrors = useTranslations("common.apiErrors")
  const router = useRouter()
  const isLogin = mode === "login"
  const { LoginSchema, RegisterSchema } = useMemo(
    () => createAuthSchemas(translate),
    [translate]
  )

  const handleApiError = useHandleApiError()

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
          handleApiError(err, apiErrors("loginFailed"))
          return
        }

        toast.success(translate("success.login"))
        router.push(res.requiresTwoFactor ? "/login/2fa" : "/dashboard")
      } else {
        const registerValue = value as ValueTypes["register"]
        const [err] = await tryCatch(
          apiFetch("/api/auth/register", RegisterSchema, {
            method: "POST",
            body: registerValue,
          })
        )

        if (err) {
          handleApiError(err, apiErrors("registerFailed"))
          return
        }

        toast.success(translate("success.register"))
        router.push("/login")
      }
    },
    validators: {
      onSubmitAsync: isLogin
        ? LoginSchema.shape.POST.shape.input
        : RegisterSchema.shape.POST.shape.input,
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Logo />
            <FieldDescription>
              {isLogin
                ? translate("form.loginDescription")
                : translate("form.registerDescription")}
            </FieldDescription>
          </div>
          {!isLogin && (
            <>
              <form.Field name="email">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {translate("fields.email")}
                    </FieldLabel>
                    <Input
                      className={
                        field.state.meta.errors.length ? "border-red-500" : ""
                      }
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={translate("placeholders.email")}
                      type="email"
                      value={field.state.value}
                    />
                    <FieldState field={field} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="fullName">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {translate("fields.fullName")}
                    </FieldLabel>
                    <Input
                      className={
                        field.state.meta.errors.length ? "border-red-500" : ""
                      }
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={translate("placeholders.fullName")}
                      type="text"
                      value={field.state.value}
                    />
                    <FieldState field={field} />
                  </Field>
                )}
              </form.Field>
            </>
          )}

          <form.Field name="username">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  {translate("fields.username")}
                </FieldLabel>
                <Input
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={translate("placeholders.username")}
                  type="text"
                  value={field.state.value}
                />
                <FieldState field={field} />
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  {translate("fields.password")}
                </FieldLabel>
                <Input
                  className={
                    field.state.meta.errors.length ? "border-red-500" : ""
                  }
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={translate("placeholders.password")}
                  type="password"
                  value={field.state.value}
                />
                <FieldState field={field} />
              </Field>
            )}
          </form.Field>

          {!isLogin && (
            <form.Field name="confirmPassword">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>
                    {translate("fields.confirmPassword")}
                  </FieldLabel>
                  <Input
                    className={
                      field.state.meta.errors.length ? "border-red-500" : ""
                    }
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={translate("placeholders.password")}
                    type="password"
                    value={field.state.value}
                  />
                  <FieldState field={field} />
                </Field>
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
                  type="submit"
                >
                  {isLogin
                    ? translate("actions.login")
                    : translate("actions.register")}
                </Button>
              )}
            </form.Subscribe>
          </Field>

          <div className="text-center text-sm">
            {isLogin ? (
              <>
                {translate("prompt.noAccount")}{" "}
                <Link className="text-primary underline" href="/register">
                  {translate("actions.register")}
                </Link>
              </>
            ) : (
              <>
                {translate("prompt.hasAccount")}{" "}
                <Link className="text-primary underline" href="/login">
                  {translate("actions.login")}
                </Link>
              </>
            )}
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
