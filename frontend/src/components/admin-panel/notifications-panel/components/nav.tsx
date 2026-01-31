import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface NavProps {
  links: {
    title: string
    icon: IconSvgElement
  }[]
  isCollapsed: boolean
}

export function NotificationNav({ links, isCollapsed }: NavProps) {
  return (
    <div
      className="flex flex-col data-[collapsed=true]:py-2"
      data-collapsed={isCollapsed}
    >
      <nav className="grid gap-1 group-data-[collapsed=true]:justify-start">
        {links.map((link) =>
          isCollapsed ? (
            <Tooltip key={link.title}>
              <TooltipTrigger>
                {/*TODO: zrobić to jako filtrowanie*/}
                <Link
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      size: "icon",
                    }),
                    "h-9"
                  )}
                  href="#"
                >
                  <HugeiconsIcon icon={link.icon} />
                  <span className="sr-only">{link.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-4" side="right">
                {link.title}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "justify-start px-3"
              )}
              href="#"
              key={link.title}
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={link.icon} />
              {link.title}
            </Link>
          )
        )}
      </nav>
    </div>
  )
}
