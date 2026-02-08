"use client"

import { UserMultiple02Icon } from "@hugeicons/core-free-icons"
import { useDeferredValue, useMemo, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import {
  ActionDialog,
  type EditUserFormValues,
} from "@/components/admin-panel/users/components/action-dialog"
import { UsersStats } from "@/components/admin-panel/users/components/users-stats"
import { UsersTable } from "@/components/admin-panel/users/components/users-table"
import {
  createEditableUser,
  normalizeValue,
  resolveTeamValue,
  TABLE_PAGE_SIZE,
} from "@/components/admin-panel/users/lib/user-utils"
import { Input } from "@/components/ui/input"
import PaginationFull from "@/components/ui/pagination-component"
import useAdminUsers, {
  useAdminUserTeams,
  useChangeAdminUserEmail,
  useDeleteAdminUser,
  useUpdateAdminUserProfile,
} from "@/hooks/use-admin-users"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"

export default function UsersMain() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const searchQuery = deferredSearch.trim() || undefined
  const isEmailQuery = searchQuery?.includes("@") ?? false

  const {
    data: usersData,
    isPending: isUsersPending,
    isError: isUsersError,
  } = useAdminUsers({
    email: isEmailQuery ? searchQuery : undefined,
    name: isEmailQuery ? undefined : searchQuery,
    page,
    size: TABLE_PAGE_SIZE,
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

  const updateProfileMutation = useUpdateAdminUserProfile()
  const changeEmailMutation = useChangeAdminUserEmail()
  const deleteUserMutation = useDeleteAdminUser()

  const users = usersData?.content ?? []
  const teams = useMemo(
    () => (isTeamsPending ? [] : (teamsData ?? [])),
    [teamsData, isTeamsPending]
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null)

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId]
  )
  const userToDelete = useMemo(
    () => users.find((user) => user.id === userIdToDelete),
    [users, userIdToDelete]
  )

  const dialogUser = useMemo(() => {
    if (!selectedUser) {
      return undefined
    }
    return createEditableUser(selectedUser, teams)
  }, [selectedUser, teams])

  const stats = useMemo(() => {
    const total = totalUsersData?.totalElements ?? 0
    const active = activeUsersData?.totalElements ?? 0

    return {
      total,
      active,
      inactive: Math.max(0, total - active),
    }
  }, [activeUsersData?.totalElements, totalUsersData?.totalElements])

  const totalPages = Math.max(usersData?.totalPages ?? 1, 1)
  const totalElements = usersData?.totalElements ?? 0
  const currentPage = page + 1
  const firstVisible = users.length > 0 ? page * TABLE_PAGE_SIZE + 1 : 0
  const lastVisible = page * TABLE_PAGE_SIZE + users.length
  let paginationSummaryText: string | null = null
  if (isUsersPending) {
    paginationSummaryText = "Ładowanie..."
  }

  const handleSetPage = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), totalPages)
    setPage(boundedPage - 1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(0)
  }

  const handleEditUser = (userId: number) => {
    if (isTeamsError) {
      toast.warning(
        "Nie udało się załadować listy zespołów. Pole zespołu może być niedostępne."
      )
    }
    setSelectedUserId(userId)
    setDialogOpen(true)
  }

  const handleDeleteUser = (userId: number) => {
    setUserIdToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = () => {
    if (userIdToDelete === null) {
      return
    }

    deleteUserMutation.mutate(userIdToDelete, {
      onSuccess: () => {
        setUserIdToDelete(null)
        toast.success("Użytkownik został usunięty")
      },
      onError: () => {
        toast.error("Nie udało się usunąć użytkownika")
      },
    })
  }

  const handleSubmitUser = async ({
    id,
    values,
  }: {
    id: number
    values: EditUserFormValues
  }) => {
    const currentUser = users.find((user) => user.id === id)
    if (!currentUser) {
      return
    }

    const nextEmail = values.email.trim()
    const nextFullName = values.fullName.trim()
    const nextPhone = values.phone.trim()
    const nextLocation = values.location.trim()
    const nextTeam = values.team.trim()

    const currentEmail = normalizeValue(currentUser.email)
    const currentFullName = normalizeValue(currentUser.full_name)
    const currentPhone = normalizeValue(currentUser.phone)
    const currentLocation = normalizeValue(currentUser.location)
    const currentTeam = resolveTeamValue(currentUser.team, teams)
    const selectedTeamOption = teams.find((team) => team.value === nextTeam)

    const didEmailChange = nextEmail !== currentEmail
    const didProfileChange =
      nextFullName !== currentFullName ||
      nextPhone !== currentPhone ||
      nextLocation !== currentLocation ||
      nextTeam !== currentTeam

    if (!(didEmailChange || didProfileChange)) {
      return
    }

    if (didEmailChange) {
      await changeEmailMutation.mutateAsync(
        {
          userId: id,
          body: { newEmail: nextEmail },
        },
        {
          onSuccess: () => {
            toast.success("Email użytkownika został zaktualizowany")
          },
          onError: () => {
            toast.error("Nie udało się zaktualizować emaila użytkownika")
          },
        }
      )
    }

    if (didProfileChange) {
      await updateProfileMutation.mutateAsync(
        {
          userId: id,
          body: {
            fullName: nextFullName || undefined,
            phone: nextPhone || undefined,
            location: nextLocation || undefined,
            team: selectedTeamOption?.value,
          },
        },
        {
          onSuccess: () => {
            toast.success("Profil użytkownika został zaktualizowany")
          },
          onError: () => {
            toast.error("Nie udało się zaktualizować profilu użytkownika")
          },
        }
      )
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Zarządzaj kontami użytkowników i ich danymi profilowymi"
        icon={UserMultiple02Icon}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Użytkownicy"
      >
        <UsersStats
          active={stats.active}
          inactive={stats.inactive}
          total={stats.total}
        />
      </AdminPageHeader>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b bg-muted/30 p-4">
          <Input
            className="max-w-sm"
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Szukaj użytkowników..."
            type="search"
            value={search}
          />
        </div>

        <UsersTable
          isError={isUsersError}
          isPending={isUsersPending}
          onDeleteUser={handleDeleteUser}
          onEditUser={handleEditUser}
          users={users}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3">
          <p className="text-muted-foreground text-sm">
            {paginationSummaryText ? (
              paginationSummaryText
            ) : (
              <>
                Wyświetlanie{" "}
                <span className="font-medium text-foreground">
                  {firstVisible}
                </span>
                –
                <span className="font-medium text-foreground">
                  {lastVisible}
                </span>{" "}
                z{" "}
                <span className="font-medium text-foreground">
                  {totalElements}
                </span>{" "}
                użytkowników
              </>
            )}
          </p>
          <PaginationFull
            currentPage={currentPage}
            setPage={handleSetPage}
            totalPages={totalPages}
          />
        </div>
      </div>

      <ActionDialog
        currentRow={dialogUser}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUserId(null)
          }
          setDialogOpen(open)
        }}
        onSubmit={handleSubmitUser}
        open={dialogOpen}
        teams={teams}
      />

      <ConfirmDialog
        description={`Czy na pewno chcesz usunąć użytkownika "${normalizeValue(userToDelete?.full_name) || userToDelete?.email || ""}"? Ta operacja jest nieodwracalna.`}
        onConfirm={confirmDeleteUser}
        onOpenChange={(open) => {
          if (!open) {
            setUserIdToDelete(null)
          }
          setDeleteDialogOpen(open)
        }}
        open={deleteDialogOpen}
        title="Usuń użytkownika"
      />
    </div>
  )
}
