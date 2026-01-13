import type { ReactNode } from "react"

interface ScannerBodyProps {
  children: ReactNode
}

export function ScannerBody({ children }: ScannerBodyProps) {
  return <div className="flex h-full flex-col p-6">{children}</div>
}
