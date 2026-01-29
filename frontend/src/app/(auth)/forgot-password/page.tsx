import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import Logo from "@/components/logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function ForgotPassword() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo />
        <p className="text-muted-foreground text-sm">
          Wprowadź adres email, a wyślemy Ci link do resetowania hasła.
        </p>
      </div>
      <div>
        <Link
          className={buttonVariants({
            className: "mb-4 flex h-auto items-center gap-1 p-0",
            size: "sm",
            variant: "link",
          })}
          href="/login"
        >
          <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
          Cofnij do logowania
        </Link>
        <form className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                autoComplete="email"
                id="email"
                inputMode="email"
                name="email"
                placeholder="jan@kowalski.pl"
                spellCheck={false}
                type="email"
              />
            </Field>
            <Field>
              <Button className="w-full" type="submit">
                Wyślij link do resetowania
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
