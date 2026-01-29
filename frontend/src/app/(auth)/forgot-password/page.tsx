import { ArrowLeft01Icon, Mail01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import AuthCard from "@/app/(auth)/components/auth-card"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getAnimationStyle } from "@/lib/utils"

export default function ForgotPassword() {
  return (
    <AuthCard>
      <form className="space-y-0">
        <FieldGroup>
          <div
            className="fade-in flex animate-in items-center justify-start duration-500"
            style={getAnimationStyle("50ms")}
          >
            <Link
              className="inline-flex items-center gap-1 font-medium text-foreground/80 text-xs uppercase tracking-wide hover:text-primary hover:underline"
              href="/login"
            >
              <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
              Cofnij do logowania
            </Link>
          </div>
          <div
            className="fade-in flex animate-in flex-col items-center gap-3 text-center duration-500"
            style={getAnimationStyle("100ms")}
          >
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-primary/10 blur-lg" />
              <Logo className="relative" />
            </div>
            <FieldDescription className="mt-2 max-w-70 text-muted-foreground/80">
              Wprowadź adres email, a wyślemy Ci link do resetowania hasła.
            </FieldDescription>
          </div>
          <div
            className="fade-in mt-2 animate-in space-y-4 duration-500"
            style={getAnimationStyle("200ms")}
          >
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel
                  className="font-medium text-foreground/80 text-xs uppercase tracking-wide"
                  htmlFor="email"
                >
                  Email
                </FieldLabel>
              </div>
              <div className="relative">
                <Input
                  autoComplete="email"
                  className="h-10 bg-background/50 pl-10 transition-all duration-200 focus:bg-background"
                  id="email"
                  inputMode="email"
                  name="email"
                  placeholder="jan@kowalski.pl"
                  spellCheck={false}
                  type="email"
                />
                <HugeiconsIcon
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
                  icon={Mail01Icon}
                />
              </div>
            </Field>
            <Field>
              <Button className="w-full" size="lg" type="submit">
                Wyślij link do resetowania
              </Button>
            </Field>
          </div>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
