"use client"

import { UserMultiple02Icon } from "@hugeicons/core-free-icons"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/admin-panel/components/dialogs"
import { ActionDialog } from "@/components/admin-panel/users/components/action-dialog"
import { StatusChangeDialog } from "@/components/admin-panel/users/components/status-change-dialog"
import { UsersFilterBar } from "@/components/admin-panel/users/components/users-filter-bar"
import { UsersStats } from "@/components/admin-panel/users/components/users-stats"
import { UsersTable } from "@/components/admin-panel/users/components/users-table"
import { WarehouseAssignmentDialog } from "@/components/admin-panel/users/components/warehouse-assignment-dialog"
import { useUsersActions } from "@/components/admin-panel/users/hooks/use-users-actions"
import { useUsersData } from "@/components/admin-panel/users/hooks/use-users-data"
import { useUsersDialogState } from "@/components/admin-panel/users/hooks/use-users-dialog-state"
import { useUsersFilters } from "@/components/admin-panel/users/hooks/use-users-filters"
import { useUsersPagination } from "@/components/admin-panel/users/hooks/use-users-pagination"
import PaginationFull from "@/components/ui/pagination-component"
import { AdminPageHeader } from "../components/admin-page-header"
export default function UsersMain() {
  const t = useTranslations()

  const {
    page,
    search,
    searchQuery,
    isEmailQuery,
    statusFilter,
    setPage,
    handleSearchChange,
    handleStatusFilterChange,
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
    statusFilter,
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
    statusDialogOpen,
    statusDialogUser,
    openStatusDialog,
    handleStatusDialogOpenChange,
    warehouseDialogOpen,
    warehouseDialogUser,
    openWarehouseDialog,
    handleWarehouseDialogOpenChange,
  } = useUsersDialogState({
    users,
    teams,
  })
  const {
    confirmDeleteUser,
    handleSubmitUser,
    changeUserStatus,
    assignWarehouse,
    removeWarehouseAssignment,
  } = useUsersActions({
    users,
    teams,
    userIdToDelete,
    clearUserIdToDelete: () => {
      setUserIdToDelete(null)
    },
  })
  const { currentPage, totalPages } = useUsersPagination({
    page,
    usersCount: users.length,
    usersData,
    isUsersPending,
    setPage,
  })

  const handleEditUser = (userId: number) => {
    if (isTeamsError) {
      toast.warning(t("generated.admin.users.failedLoadTeamListTeam"))
    }
    openEditDialog(userId)
  }

  const handleDeleteUser = (userId: number) => {
    openDeleteDialog(userId)
  }

  const handleChangeStatus = (userId: number) => {
    openStatusDialog(userId)
  }

  const handleAssignWarehouse = (userId: number) => {
    openWarehouseDialog(userId)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description={t("generated.admin.users.manageUserAccountsProfileData")}
        icon={UserMultiple02Icon}
        title={t("generated.shared.users")}
      >
        <UsersStats
          active={stats.active}
          inactive={stats.inactive}
          total={stats.total}
        />
      </AdminPageHeader>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <UsersFilterBar
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          search={search}
          statusFilter={statusFilter}
        />

        <UsersTable
          isError={isUsersError}
          isPending={isUsersPending}
          onAssignWarehouse={handleAssignWarehouse}
          onChangeStatus={handleChangeStatus}
          onDeleteUser={handleDeleteUser}
          onEditUser={handleEditUser}
          users={users}
        />

        <PaginationFull
          currentPage={currentPage}
          setPage={setPage}
          totalPages={totalPages}
          variant="compact"
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
        title={t("generated.admin.users.deleteUser")}
      />

      <StatusChangeDialog
        onConfirm={changeUserStatus}
        onOpenChange={handleStatusDialogOpenChange}
        open={statusDialogOpen}
        user={statusDialogUser}
      />

      <WarehouseAssignmentDialog
        onAssign={assignWarehouse}
        onOpenChange={handleWarehouseDialogOpenChange}
        onRemove={removeWarehouseAssignment}
        open={warehouseDialogOpen}
        user={warehouseDialogUser}
      />
    </div>
  )
}
