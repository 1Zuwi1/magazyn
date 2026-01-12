import type React from "react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  children: React.ReactNode
}

export function Header({ children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        "z-20 h-0",
        "header-fixed peer/header sticky top-0 w-inherit"
      )}
      {...props}
    >
      <div
        className={cn("relative flex h-full items-center gap-3 p-4 sm:gap-4")}
      >
        {children}
      </div>
    </header>
  )
}
