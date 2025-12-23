"use client"

import { useForm } from "@tanstack/react-form"
import z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const LoginSchema = z.object({
  email: z.email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
})

export default function LoginPage() {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async (values) => {
      return values
    },
    validators: {
      onSubmit: LoginSchema,
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          Zaloguj się do swojego konta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit(e)
          }}
        >
          <FieldGroup>
            <form.Field name="email">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="m@example.com"
                    required
                    type="email"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="mt-1 text-red-600 text-sm">
                      {field.state.meta.errors[0].message}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Hasło</FieldLabel>
                    <a
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                      href="/forgot-password"
                    >
                      Zapomniałeś hasła?
                    </a>
                  </div>
                  <Input
                    id="password"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    type="password"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="mt-1 text-red-600 text-sm">
                      {field.state.meta.errors[0].message}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>
            <Field>
              <Button type="submit"> Zaloguj się</Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
