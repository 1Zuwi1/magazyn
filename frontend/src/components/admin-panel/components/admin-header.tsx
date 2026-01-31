import type React from "react"
import { cn } from "@/lib/utils"

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export function AdminHeader({ children, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "z-20 h-0",
        "header-fixed peer/header sticky top-0 w-inherit",
        className
      )}
    >
      <div className={cn("flex justify-between gap-3 sm:gap-4")}>
        {children}
      </div>
    </header>
  )
}
