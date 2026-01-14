"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { dockActions } from "@/config/navigation"
import { buttonVariants } from "./ui/button"

export function Dock() {
  const pathname = usePathname()

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-50 standalone:flex hidden w-full justify-center p-4 pb-8">
      <nav className="pointer-events-auto flex items-center gap-2 rounded-2xl border bg-background/80 p-2 shadow-2xl backdrop-blur-md">
        {dockActions.map((item, index) => {
          const isActive = pathname === item.href
          return (
            <Link
              className={buttonVariants({
                variant: isActive ? "default" : "ghost",
                className:
                  "flex h-full flex-col items-center gap-1 rounded-xl px-4 py-2",
              })}
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
