import type React from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex flex-col gap-4 p-4 pt-6">{children}</div>
}
