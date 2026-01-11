import type React from "react"
import ProtectedPage from "../../protected-page"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedPage>
      <div className="flex flex-col gap-4 p-4 pt-6">{children}</div>
    </ProtectedPage>
  )
}
