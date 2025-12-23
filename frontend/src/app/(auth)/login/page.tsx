"use client"

import { type AnyFieldApi, useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { type ZodError, z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { createApiSchema } from "@/lib/create-api-schema"
import { apiFetch } from "@/lib/fetcher"
import tryCatch from "@/lib/try-catch"

const LoginSchema = createApiSchema({
  POST: {
    input: z.object({
      email: z.email("Nieprawidłowy adres email"),
      password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
      rememberMe: z.boolean().refine((val) => typeof val === "boolean", {
        message: "Pole zapamiętaj mnie musi być wartością logiczną",
      }),
    }),
    output: z.null(),
  },
})

function FieldState({ field }: { field: AnyFieldApi }) {
  const error = field.state.meta.errors[0] as ZodError

  return error ? (
    <p className="mt-1 text-wrap text-red-600 text-xs">{error.message}</p>
  ) : null
}

export default function LoginPage() {
  // --- 3. Inicjalizacja formularza ---
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    onSubmit: async ({ value }) => {
      const [err, _] = await tryCatch(
        apiFetch("/api/auth/login", LoginSchema, {
          method: "POST",
          body: { ...value },
        })
      )

      if (err) {
        toast.error("Wystąpił błąd podczas logowania. Spróbuj ponownie.")
        return
      }

      toast.success("Zalogowano pomyślnie!")
    },
    validators: {
      onSubmitAsync: LoginSchema.shape.POST.shape.input,
    },
  })

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Zaloguj się</CardTitle>
          <CardDescription>
            Wprowadź swój email i hasło, aby uzyskać dostęp do konta.
          </CardDescription>
        </CardHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <CardContent className="space-y-4">
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    className={
                      field.state.meta.errors.length ? "border-red-500" : ""
                    }
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="jan@kowalski.pl"
                    type="email"
                    value={field.state.value}
                  />
                  <FieldState field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Hasło</Label>
                  <Input
                    className={
                      field.state.meta.errors.length ? "border-red-500" : ""
                    }
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    value={field.state.value}
                  />
                  <FieldState field={field} />
                </div>
              )}
            </form.Field>

            <form.Field name="rememberMe">
              {(field) => (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    checked={field.state.value}
                    id={field.name}
                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                  />
                  <Label
                    className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    htmlFor={field.name}
                  >
                    Zapamiętaj mnie
                  </Label>
                  <FieldState field={field} />
                </div>
              )}
            </form.Field>
          </CardContent>

          <CardFooter className="pt-4">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button className="w-full" disabled={!canSubmit} type="submit">
                  Zaloguj się {isSubmitting && <Spinner />}
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
