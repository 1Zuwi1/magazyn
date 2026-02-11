import "server-only"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import UnauthorizedComponent from "@/app/[locale]/(requireAuth)/components/unauthorized"
import { getSession } from "@/lib/session"

type Children =
  | ReactNode
  | ((
      session: NonNullable<Awaited<ReturnType<typeof getSession>>>
    ) => ReactNode)

interface Props {
  children: Children
  needAdminPrivileges?: boolean
  redirectTo?: string
}

export default async function ProtectedPage({
  children,
  needAdminPrivileges,
  redirectTo = "/login",
}: Props) {
  const session = await getSession(redirectTo)
  if (!session) {
    return null
  }

  if (session.account_status === "PENDING_VERIFICATION") {
    redirect("/pending-verification")
  }

  // If the user is not an admin and admin privileges are required, return Unauthorized
  if (needAdminPrivileges && session.role !== "ADMIN") {
    return <UnauthorizedComponent />
  }

  // If the child is a function, inject the session so the page can use it
  if (typeof children === "function") {
    return <>{await children(session)}</>
  }

  // No need for the session inside the page → just render
  return <>{children}</>
}
