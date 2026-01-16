"use client"

import { createContext, use, useState } from "react"
import { CommandMenu, type NavGroup } from "./command-menu"

interface SearchContextType {
  setOpen: (open: boolean) => void
}

const SearchContext = createContext<SearchContextType | null>(null)

export function useSearch() {
  const context = use(SearchContext)
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}

interface SearchProviderProps {
  children: React.ReactNode
  navData?: NavGroup[]
  isActive?: boolean
}

export function SearchProvider({ children, navData }: SearchProviderProps) {
  const [open, setOpen] = useState(false)

  return (
    <SearchContext value={{ setOpen }}>
      {children}
      <CommandMenu navData={navData} open={open} setOpen={setOpen} />
    </SearchContext>
  )
}
