import type { ReactNode } from "react"
import { getSession } from "@/lib/session"
import "server-only"
import UnauthorizedComponent from "./components/unauthorized"

type Children =
  | ReactNode
  | ((session: Awaited<ReturnType<typeof getSession>>) => ReactNode)

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

  // If the user is not an admin and admin privileges are required, return Unauthorized
  if (needAdminPrivileges && session.role !== "admin") {
    return <UnauthorizedComponent />
  }

  // If the child is a function, inject the session so the page can use it
  if (typeof children === "function") {
    return <>{children(session)}</>
  }

  // No need for the session inside the page → just render
  return <>{children}</>
}
