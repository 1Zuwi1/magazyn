"use client"

import { LaptopIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface NavItem {
  title: string
  url?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

interface CommandMenuProps {
  initialQuery?: string
  navData?: NavGroup[]
  open: boolean
  setOpen: (open: boolean) => void
}

export function CommandMenu({
  initialQuery = "",
  navData,
  open,
  setOpen,
}: CommandMenuProps) {
  const { setTheme } = useTheme()
  const router = useRouter()
  const navGroups = navData || []
  function changeTheme(theme: "light" | "dark" | "system") {
    setTheme(theme)
    setOpen(false)
  }
  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandInput
        defaultValue={initialQuery}
        placeholder="Wpisz polecenie lub wyszukaj"
      />
      <CommandList>
        <ScrollArea className="h-72 pe-1">
          <CommandEmpty>No results found.</CommandEmpty>

          {navGroups.map((group) => (
            <CommandGroup key={group.title}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.title}
                  onSelect={() => {
                    if (item.url) {
                      router.push(item.url)
                    }
                    setOpen(false)
                  }}
                >
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          <CommandSeparator />
          <CommandGroup heading="Motyw">
            <CommandItem
              onSelect={() => {
                changeTheme("light")
              }}
            >
              <HugeiconsIcon icon={Sun03Icon} /> <span>Jasny</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                changeTheme("dark")
              }}
            >
              <HugeiconsIcon className="scale-90" icon={Moon02Icon} />
              <span>Ciemny</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                changeTheme("system")
              }}
            >
              <HugeiconsIcon icon={LaptopIcon} />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
