import { useDeferredValue, useState } from "react"
import type { AdminUser } from "@/hooks/use-admin-users"

type AccountStatus = AdminUser["account_status"]

interface UseUsersFiltersResult {
  page: number
  search: string
  searchQuery: string | undefined
  isEmailQuery: boolean
  statusFilter: AccountStatus | undefined
  setPage: (nextPage: number) => void
  handleSearchChange: (value: string) => void
  handleStatusFilterChange: (status: AccountStatus | undefined) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

export function useUsersFilters(): UseUsersFiltersResult {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<AccountStatus | undefined>(
    undefined
  )
  const deferredSearch = useDeferredValue(search)
  const searchQuery = deferredSearch.trim() || undefined
  const isEmailQuery = searchQuery?.includes("@") ?? false

  const hasActiveFilters = statusFilter !== undefined

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleStatusFilterChange = (status: AccountStatus | undefined) => {
    setStatusFilter(status)
    setPage(0)
  }

  const clearFilters = () => {
    setStatusFilter(undefined)
    setSearch("")
    setPage(0)
  }

  return {
    page,
    search,
    searchQuery,
    isEmailQuery,
    statusFilter,
    setPage,
    handleSearchChange,
    handleStatusFilterChange,
    clearFilters,
    hasActiveFilters,
  }
}
