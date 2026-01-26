"use client"

import { createContext, useContext, useState } from "react"
import {
  CommandMenu,
  type NavGroup,
} from "@/components/admin-panel/components/search-bar/command-menu"

interface SearchContextType {
  setOpen: (open: boolean) => void
}

const SearchContext = createContext<SearchContextType | null>(null)

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}

interface SearchProviderProps {
  children: React.ReactNode
  navData?: NavGroup[]
}

export function SearchProvider({ children, navData }: SearchProviderProps) {
  const [open, setOpen] = useState(false)

  return (
    <SearchContext.Provider value={{ setOpen }}>
      {children}
      <CommandMenu navData={navData} open={open} setOpen={setOpen} />
    </SearchContext.Provider>
  )
}
