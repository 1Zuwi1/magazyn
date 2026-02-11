import { redirect } from "next/navigation"
import { apiFetch } from "@/lib/fetcher"
import { type ResendType, TFASchema } from "@/lib/schemas"
import { getSession } from "@/lib/session"
import tryCatch from "@/lib/try-catch"
import TwoFactorForm from "./two-factor-form"

const RESEND_METHODS: ResendType[] = ["EMAIL"]

export default async function TwoFactorPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  const [err, linkedMethods] = await tryCatch(apiFetch("/api/2fa", TFASchema))

  if (err) {
    redirect("/login")
  }

  return (
    <TwoFactorForm
      defaultLinkedMethod={linkedMethods.defaultMethod}
      linkedMethods={linkedMethods.methods}
      otpLength={6}
      resendMethods={RESEND_METHODS}
    />
  )
}
