"use client"

import { Menu } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ADMIN_NAV_LINKS } from "@/components/admin-panel/lib/constants"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function TopNav() {
  const pathname = usePathname()

  const links = ADMIN_NAV_LINKS.map((link) => ({
    title: link.title,
    href: link.url,
    isActive:
      pathname === link.url ||
      (link.url === "/admin" && pathname === "/admin/"),
  }))
  return (
    <>
      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "md:size-7",
              buttonVariants({ variant: "outline", size: "icon" })
            )}
          >
            <HugeiconsIcon icon={Menu} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            {links.map((link) => (
              <DropdownMenuItem key={link.href}>
                <Link
                  aria-current={link.isActive ? "page" : undefined}
                  className={link.isActive ? "" : "text-muted-foreground"}
                  href={link.href}
                >
                  {link.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav
        className={cn(
          "hidden items-center space-x-4 lg:flex lg:space-x-4 xl:space-x-6"
        )}
      >
        {links.map((link) => (
          <Link
            aria-current={link.isActive ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              link.isActive ? "" : "text-muted-foreground"
            )}
            href={link.href}
            key={link.href}
          >
            {link.title}
          </Link>
        ))}
      </nav>
    </>
  )
}
