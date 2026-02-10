import type { AdminUsersList } from "@/hooks/use-admin-users"
import { translateMessage } from "@/i18n/translate-message"
import { TABLE_PAGE_SIZE } from "../lib/user-utils"

interface UseUsersPaginationParams {
  page: number
  usersCount: number
  usersData: AdminUsersList | undefined
  isUsersPending: boolean
  setPage: (page: number) => void
}

interface UseUsersPaginationResult {
  currentPage: number
  totalPages: number
  totalElements: number
  firstVisible: number
  lastVisible: number
  paginationSummaryText: string | null
  handleSetPage: (nextPage: number) => void
}

export function useUsersPagination({
  page,
  usersCount,
  usersData,
  isUsersPending,
  setPage,
}: UseUsersPaginationParams): UseUsersPaginationResult {
  const totalPages = Math.max(usersData?.totalPages ?? 1, 1)
  const totalElements = usersData?.totalElements ?? 0
  const currentPage = page + 1
  const firstVisible = usersCount > 0 ? page * TABLE_PAGE_SIZE + 1 : 0
  const lastVisible = page * TABLE_PAGE_SIZE + usersCount
  const paginationSummaryText = isUsersPending
    ? translateMessage("generated.m0316")
    : null

  const handleSetPage = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), totalPages)
    setPage(boundedPage - 1)
  }

  return {
    currentPage,
    totalPages,
    totalElements,
    firstVisible,
    lastVisible,
    paginationSummaryText,
    handleSetPage,
  }
}
