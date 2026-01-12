"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { CommandMenu, type NavData, type NavItem } from "./command-menu"

interface SearchContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SearchContext = createContext<SearchContextType | null>(null)

interface SearchProviderProps {
  children: React.ReactNode
  navDane?: NavData[]
  subDane?: NavItem[]
}

export function SearchProvider({
  children,
  navDane,
  subDane,
}: SearchProviderProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <SearchContext value={{ open, setOpen }}>
      {children}
      <CommandMenu
        navDane={navDane}
        onOpenChange={setOpen}
        open={open}
        subDane={subDane}
      />
    </SearchContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSearch = () => {
  const searchContext = useContext(SearchContext)

  if (!searchContext) {
    throw new Error("useSearch has to be used within SearchProvider")
  }

  return searchContext
}
