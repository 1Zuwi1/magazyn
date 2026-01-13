import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import TwoFactorForm, {
  type ResendType,
  type TwoFactorMethod,
} from "./two-factor-form"

// TODO: Fetch linked_methods from backend API
const LINKED_METHODS: TwoFactorMethod[] = ["authenticator", "sms", "email"]
const RESEND_METHODS: ResendType[] = ["sms", "email"]

export default async function TwoFactorPage() {
  const session = await getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <TwoFactorForm
          linkedMethods={LINKED_METHODS}
          otpLength={6}
          resendMethods={RESEND_METHODS}
        />
      </div>
    </div>
  )
}
