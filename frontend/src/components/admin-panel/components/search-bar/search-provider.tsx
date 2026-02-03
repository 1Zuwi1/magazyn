"use client"

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react"
import {
  CommandMenu,
  type NavGroup,
} from "@/components/admin-panel/components/search-bar/command-menu"

interface SearchContextType {
  openWithQuery: (query?: string) => void
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
  children: ReactNode
  navData?: NavGroup[]
}

export function SearchProvider({ children, navData }: SearchProviderProps) {
  const [open, setOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState("")

  const contextValue = useMemo(
    () => ({
      openWithQuery: (query?: string) => {
        setInitialQuery(query ?? "")
        setOpen(true)
      },
    }),
    []
  )

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setInitialQuery("")
    }
  }

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
      <CommandMenu
        initialQuery={initialQuery}
        navData={navData}
        open={open}
        setOpen={handleOpenChange}
      />
    </SearchContext.Provider>
  )
}
