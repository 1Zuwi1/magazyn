"use client"

import { UserMultiple02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { ActionDialog } from "@/components/admin-panel/users/components/action-dialog"
import { UsersPaginationFooter } from "@/components/admin-panel/users/components/users-pagination-footer"
import { UsersSearchInput } from "@/components/admin-panel/users/components/users-search-input"
import { UsersStats } from "@/components/admin-panel/users/components/users-stats"
import { UsersTable } from "@/components/admin-panel/users/components/users-table"
import { useUsersActions } from "@/components/admin-panel/users/hooks/use-users-actions"
import { useUsersData } from "@/components/admin-panel/users/hooks/use-users-data"
import { useUsersDialogState } from "@/components/admin-panel/users/hooks/use-users-dialog-state"
import { useUsersFilters } from "@/components/admin-panel/users/hooks/use-users-filters"
import { useUsersPagination } from "@/components/admin-panel/users/hooks/use-users-pagination"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"

export default function UsersMain() {
  const {
    page,
    search,
    searchQuery,
    isEmailQuery,
    setPage,
    handleSearchChange,
  } = useUsersFilters()
  const {
    usersData,
    users,
    isUsersPending,
    isUsersError,
    teams,
    isTeamsError,
    stats,
  } = useUsersData({
    page,
    isEmailQuery,
    searchQuery,
  })
  const {
    dialogOpen,
    dialogUser,
    openEditDialog,
    handleEditDialogOpenChange,
    deleteDialogOpen,
    openDeleteDialog,
    handleDeleteDialogOpenChange,
    userIdToDelete,
    setUserIdToDelete,
    deleteDescription,
  } = useUsersDialogState({
    users,
    teams,
  })
  const { confirmDeleteUser, handleSubmitUser } = useUsersActions({
    users,
    teams,
    userIdToDelete,
    clearUserIdToDelete: () => {
      setUserIdToDelete(null)
    },
  })
  const {
    currentPage,
    totalPages,
    totalElements,
    firstVisible,
    lastVisible,
    paginationSummaryText,
    handleSetPage,
  } = useUsersPagination({
    page,
    usersCount: users.length,
    usersData,
    isUsersPending,
    setPage,
  })

  const handleEditUser = (userId: number) => {
    if (isTeamsError) {
      toast.warning(
        "Nie udało się załadować listy zespołów. Pole zespołu może być niedostępne."
      )
    }
    openEditDialog(userId)
  }

  const handleDeleteUser = (userId: number) => {
    openDeleteDialog(userId)
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
        <UsersSearchInput onChange={handleSearchChange} value={search} />

        <UsersTable
          isError={isUsersError}
          isPending={isUsersPending}
          onDeleteUser={handleDeleteUser}
          onEditUser={handleEditUser}
          users={users}
        />

        <UsersPaginationFooter
          currentPage={currentPage}
          firstVisible={firstVisible}
          lastVisible={lastVisible}
          onSetPage={handleSetPage}
          paginationSummaryText={paginationSummaryText}
          totalElements={totalElements}
          totalPages={totalPages}
        />
      </div>

      <ActionDialog
        currentRow={dialogUser}
        onOpenChange={handleEditDialogOpenChange}
        onSubmit={handleSubmitUser}
        open={dialogOpen}
        teams={teams}
      />

      <ConfirmDialog
        description={deleteDescription}
        onConfirm={confirmDeleteUser}
        onOpenChange={handleDeleteDialogOpenChange}
        open={deleteDialogOpen}
        title="Usuń użytkownika"
      />
    </div>
  )
}
