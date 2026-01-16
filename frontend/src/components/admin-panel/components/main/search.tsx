"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useSearch } from "@/components/admin-panel/components/main/search-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupButton } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

interface SearchProps {
  className?: string
  placeholder?: string
}

export function Search({ className, placeholder = "Search" }: SearchProps) {
  const { setOpen } = useSearch()

  return (
    <InputGroup className={cn("w-full sm:w-60", className)}>
      <Input
        className="border-0 shadow-none focus-visible:ring-0"
        placeholder={placeholder}
      />
      <InputGroupButton
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        onClick={() => setOpen(true)}
        title="Rozwiń menu"
      >
        <HugeiconsIcon icon={Search01Icon} />
      </InputGroupButton>
    </InputGroup>
  )
}
