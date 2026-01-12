import type React from "react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  fixed?: boolean
  children: React.ReactNode
}

export function Header({ fixed, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        "z-20 h-0",
        fixed && "header-fixed peer/header sticky top-0 w-inherit"
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
