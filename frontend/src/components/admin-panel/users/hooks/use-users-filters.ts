import { useDeferredValue, useState } from "react"

interface UseUsersFiltersResult {
  page: number
  search: string
  searchQuery: string | undefined
  isEmailQuery: boolean
  setPage: (nextPage: number) => void
  handleSearchChange: (value: string) => void
}

export function useUsersFilters(): UseUsersFiltersResult {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const searchQuery = deferredSearch.trim() || undefined
  const isEmailQuery = searchQuery?.includes("@") ?? false

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  return {
    page,
    search,
    searchQuery,
    isEmailQuery,
    setPage,
    handleSearchChange,
  }
}
