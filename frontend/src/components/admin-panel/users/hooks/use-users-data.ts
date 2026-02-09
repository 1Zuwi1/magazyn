import { useMemo } from "react"
import type { AdminUser } from "@/hooks/use-admin-users"
import useAdminUsers, { useAdminUserTeams } from "@/hooks/use-admin-users"
import { TABLE_PAGE_SIZE } from "../lib/user-utils"

type AccountStatus = AdminUser["account_status"]

interface UseUsersDataParams {
  page: number
  isEmailQuery: boolean
  searchQuery?: string
  statusFilter?: AccountStatus
}

export function useUsersData({
  page,
  isEmailQuery,
  searchQuery,
  statusFilter,
}: UseUsersDataParams) {
  const {
    data: usersData,
    isPending: isUsersPending,
    isError: isUsersError,
  } = useAdminUsers({
    email: isEmailQuery ? searchQuery : undefined,
    name: isEmailQuery ? undefined : searchQuery,
    page,
    size: TABLE_PAGE_SIZE,
    status: statusFilter,
  })
  const {
    data: teamsData,
    isPending: isTeamsPending,
    isError: isTeamsError,
  } = useAdminUserTeams()
  const { data: totalUsersData } = useAdminUsers({
    page: 0,
    size: 1,
  })
  const { data: activeUsersData } = useAdminUsers({
    page: 0,
    size: 1,
    status: "ACTIVE",
  })

  const users = usersData?.content ?? []
  const teams = useMemo(
    () => (isTeamsPending ? [] : (teamsData ?? [])),
    [teamsData, isTeamsPending]
  )

  const stats = useMemo(() => {
    const total = totalUsersData?.totalElements ?? 0
    const active = activeUsersData?.totalElements ?? 0

    return {
      total,
      active,
      inactive: Math.max(0, total - active),
    }
  }, [activeUsersData?.totalElements, totalUsersData?.totalElements])

  return {
    usersData,
    users,
    isUsersPending,
    isUsersError,
    teams,
    isTeamsError,
    stats,
  }
}
