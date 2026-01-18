"use client"

import {
  ArrowRight01Icon,
  LaptopIcon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons"
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
  items?: NavItem[]
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

interface CommandMenuProps {
  navData?: NavGroup[]
  open: boolean
  setOpen: (open: boolean) => void
}

export function CommandMenu({ navData, open, setOpen }: CommandMenuProps) {
  const { setTheme } = useTheme()
  const router = useRouter()
  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandInput placeholder="Wpisz polecenie lub wyszukaj" />
      <CommandList>
        <ScrollArea className="h-72 pe-1">
          <CommandEmpty>No results found.</CommandEmpty>
          {navData?.map((group) => (
            <CommandGroup heading={group.title} key={group.title}>
              {group.items.map((navItem, i) => {
                if (navItem.url) {
                  return (
                    <CommandItem
                      key={`${navItem.url}-${i}`}
                      onSelect={() => {
                        router.push(navItem.url as string)

                        setOpen(false)
                      }}
                      value={navItem.title}
                    >
                      <div className="flex size-4 items-center justify-center">
                        <HugeiconsIcon
                          className="size-2 text-muted-foreground/80"
                          icon={ArrowRight01Icon}
                        />
                      </div>
                      {navItem.title}
                    </CommandItem>
                  )
                }

                return navItem.items?.map((subItem) => (
                  <CommandItem
                    key={subItem.title}
                    onSelect={() => {
                      router.push(subItem.url as string)
                      setOpen(false)
                    }}
                    value={`${navItem.title} ${subItem.title}`}
                  >
                    <div className="flex size-4 items-center justify-center">
                      <HugeiconsIcon
                        className="size-2 text-muted-foreground/80"
                        icon={ArrowRight01Icon}
                      />
                    </div>
                    {navItem.title}
                    <HugeiconsIcon
                      className="mx-1 size-2 text-muted-foreground/80"
                      icon={ArrowRight01Icon}
                    />
                    {subItem.title}
                  </CommandItem>
                ))
              })}
            </CommandGroup>
          ))}

          <CommandSeparator />
          <CommandGroup heading="Motyw">
            <CommandItem
              onSelect={() => {
                setTheme("light")
                setOpen(false)
              }}
            >
              <HugeiconsIcon icon={Sun03Icon} /> <span>Jasny</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme("dark")
                setOpen(false)
              }}
            >
              <HugeiconsIcon className="scale-90" icon={Moon02Icon} />
              <span>Ciemny</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme("system")
                setOpen(false)
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
