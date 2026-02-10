"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type KeyboardEvent, useState } from "react"
import { useSearch } from "@/components/admin-panel/components/search-bar/search-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupButton } from "@/components/ui/input-group"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"

interface SearchProps {
  className?: string
  placeholder?: string
}

export function Search({ className, placeholder }: SearchProps) {
  const { openWithQuery } = useSearch()
  const [value, setValue] = useState("")
  const resolvedPlaceholder = placeholder ?? translateMessage("search.label")

  const handleOpenSearch = () => {
    openWithQuery(value)
    setValue("")
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleOpenSearch()
    }
  }

  return (
    <InputGroup className={cn("w-full sm:w-60", className)}>
      <Input
        className="border-0 shadow-none focus-visible:ring-0"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={resolvedPlaceholder}
        value={value}
      />
      <InputGroupButton
        aria-label={translateMessage("generated.admin.shared.expandSearchMenu")}
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        onClick={handleOpenSearch}
        title={translateMessage("generated.admin.shared.expandMenu")}
      >
        <HugeiconsIcon icon={Search01Icon} />
      </InputGroupButton>
    </InputGroup>
  )
}
