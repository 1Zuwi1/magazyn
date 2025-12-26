import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import LoginForm from "./form"

export default async function LoginPage() {
  const session = await getSession()
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
