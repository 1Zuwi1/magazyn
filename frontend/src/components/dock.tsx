"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { navigationItems } from "@/config/navigation"
import { cn } from "@/lib/utils"
import { Scanner } from "./scanner/scanner"
import { DialogTrigger } from "./ui/dialog"

export function Dock() {
  const pathname = usePathname()

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-50 standalone:flex hidden w-full justify-center p-4 pb-8">
      <nav className="pointer-events-auto flex items-center gap-2 rounded-2xl border bg-background/80 p-2 shadow-2xl backdrop-blur-md">
        {navigationItems.map((item, index) => {
          const isPWA = "pwaOnly" in item
          const isActive = isPWA ? false : pathname === item.href
          if (isPWA) {
            return (
              <Scanner
                dialogTrigger={
                  <DialogTrigger>
                    <Link
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      href={"#"}
                      key={index}
                    >
                      <HugeiconsIcon className="size-6" icon={item.icon} />
                      <span className="font-medium text-[10px]">
                        {item.title}
                      </span>
                    </Link>
                  </DialogTrigger>
                }
                key={index}
              />
            )
          }
          return (
            <Link
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              href={item.href}
              key={index}
            >
              <HugeiconsIcon className="size-6" icon={item.icon} />
              <span className="font-medium text-[10px]">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
