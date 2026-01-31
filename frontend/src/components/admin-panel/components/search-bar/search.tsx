"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { useSearch } from "@/components/admin-panel/components/search-bar/search-provider"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupButton } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

interface SearchProps {
  className?: string
  placeholder?: string
}

export function Search({ className, placeholder = "Search" }: SearchProps) {
  const { openWithQuery } = useSearch()
  const [value, setValue] = useState("")

  const handleOpenSearch = () => {
    openWithQuery(value)
    setValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        placeholder={placeholder}
        value={value}
      />
      <InputGroupButton
        aria-label="Rozwiń menu wyszukiwania"
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        onClick={handleOpenSearch}
        title="Rozwiń menu"
      >
        <HugeiconsIcon icon={Search01Icon} />
      </InputGroupButton>
    </InputGroup>
  )
}
