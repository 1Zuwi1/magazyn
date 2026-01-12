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

export function TopNav({ className, links, ...props }: TopNavProps) {
  return (
    <>
      <div className="lg:hidden">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger>
            {/* <Button className="md:size-7" size="icon" variant="outline"> */}
            <HugeiconsIcon
              className={cn(
                "md:size-7",
                buttonVariants({ variant: "outline", size: "icon" })
              )}
              icon={Menu}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            {links.map(({ title, href, isActive }) => (
              <DropdownMenuItem key={`${title}-${href}`}>
                <Link
                  className={isActive ? "" : "text-muted-foreground"}
                  href={href}
                >
                  {title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav
        className={cn(
          "hidden items-center space-x-4 lg:flex lg:space-x-4 xl:space-x-6",
          className
        )}
        {...props}
      >
        {links.map(({ title, href, isActive }) => (
          <Link
            aria-disabled={isActive ? undefined : true}
            className={cn(
              "font-medium text-sm transition-colors hover:text-slate-50",
              isActive ? "" : "cursor-text text-muted-foreground"
            )}
            href={href}
            key={`${title}-${href}`}
          >
            {title}
          </Link>
        ))}
      </nav>
    </>
  )
}
