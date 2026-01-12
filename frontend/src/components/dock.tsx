"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { navigationItems } from "@/config/navigation"
import { Scanner } from "./scanner/scanner"
import { buttonVariants } from "./ui/button"
import { DialogTrigger } from "./ui/dialog"

export function Dock() {
  const pathname = usePathname()

  const splitted = pathname.split("/").filter((part) => part !== "")
  const scannerEnabled = pathname.includes("/dashboard/warehouse/")

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
                  <DialogTrigger
                    aria-disabled={!scannerEnabled}
                    className={buttonVariants({
                      variant: "ghost",
                      className:
                        "flex h-full flex-col items-center gap-1 rounded-xl px-4 py-2",
                    })}
                    onClick={(e) => {
                      if (!scannerEnabled) {
                        e.preventBaseUIHandler()

                        toast.error("Skaner dostępny tylko w widoku magazynu.")
                      }
                    }}
                  >
                    <HugeiconsIcon className="size-6" icon={item.icon} />
                    <span className="font-medium text-[10px]">
                      {item.title}
                    </span>
                  </DialogTrigger>
                }
                key={index}
                warehouseName={decodeURIComponent(splitted[2])}
              />
            )
          }
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
