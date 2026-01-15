import { Menu } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface TopNavProps extends React.HTMLAttributes<HTMLElement> {
  links: {
    title: string
    href: string
    isActive: boolean
  }[]
}

export function TopNav({ links }: TopNavProps) {
  return (
    <>
      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <HugeiconsIcon
              className={cn(
                "md:size-7",
                buttonVariants({ variant: "outline", size: "icon" })
              )}
              icon={Menu}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            {links.map((link) => (
              <DropdownMenuItem key={link.href}>
                <Link
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
            aria-disabled={link.isActive ? undefined : true}
            className={cn(
              "font-medium text-sm transition-colors hover:text-slate-50",
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
