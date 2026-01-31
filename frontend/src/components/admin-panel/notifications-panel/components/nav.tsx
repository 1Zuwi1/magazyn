import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import type { NotificationType } from "@/components/dashboard/types"
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
    filterValue: NotificationType | null
  }[]
  isCollapsed: boolean
  activeFilter: NotificationType | null
  onFilterChange: (filter: NotificationType | null) => void
}

export function NotificationNav({
  links,
  isCollapsed,
  activeFilter,
  onFilterChange,
}: NavProps) {
  return (
    <div
      className="flex flex-col data-[collapsed=true]:py-2"
      data-collapsed={isCollapsed}
    >
      <nav className="grid gap-1 group-data-[collapsed=true]:justify-start">
        {links.map((link) =>
          isCollapsed ? (
            <Tooltip key={link.title}>
              <TooltipTrigger
                className={cn(
                  buttonVariants({
                    variant:
                      activeFilter === link.filterValue ? "secondary" : "ghost",
                    size: "icon",
                  }),
                  "h-9 cursor-pointer"
                )}
                onClick={() => onFilterChange(link.filterValue)}
              >
                <HugeiconsIcon icon={link.icon} />
                <span className="sr-only">{link.title}</span>
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-4" side="right">
                {link.title}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              className={cn(
                buttonVariants({
                  variant:
                    activeFilter === link.filterValue ? "secondary" : "ghost",
                  size: "sm",
                }),
                "cursor-pointer justify-start px-3"
              )}
              key={link.title}
              onClick={() => onFilterChange(link.filterValue)}
              type="button"
            >
              <HugeiconsIcon className="mr-2 h-4 w-4" icon={link.icon} />
              {link.title}
            </button>
          )
        )}
      </nav>
    </div>
  )
}
