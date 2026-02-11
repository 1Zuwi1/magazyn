import { useTranslations } from "next-intl"
import { toast } from "sonner"
import type {
  AdminTeamOption,
  AdminUser,
  ChangeAdminUserEmailInput,
  UpdateAdminUserProfileInput,
} from "@/hooks/use-admin-users"
import {
  useChangeAdminUserEmail,
  useDeleteAdminUser,
  useUpdateAdminUserProfile,
  useUpdateAdminUserStatus,
  useUsersWarehouseAssignments,
  useUsersWarehouseAssignmentsDelete,
} from "@/hooks/use-admin-users"
import type { EditUserFormValues } from "../components/action-dialog"
import { normalizeValue, resolveTeamValue } from "../lib/user-utils"

type AccountStatus = AdminUser["account_status"]

interface UseUsersActionsParams {
  users: AdminUser[]
  teams: AdminTeamOption[]
  userIdToDelete: number | null
  clearUserIdToDelete: () => void
}

interface SubmitUserParams {
  id: number
  values: EditUserFormValues
}

const createProfilePayload = ({
  fullName,
  phone,
  location,
  selectedTeam,
  role,
}: {
  fullName: string
  phone: string
  location: string
  selectedTeam?: AdminTeamOption
  role?: "USER" | "ADMIN"
}): UpdateAdminUserProfileInput => ({
  fullName: fullName || undefined,
  phone: phone || undefined,
  location: location || undefined,
  team: selectedTeam?.value,
  role,
})

const createEmailPayload = (email: string): ChangeAdminUserEmailInput => ({
  newEmail: email,
})

export function useUsersActions({
  users,
  teams,
  userIdToDelete,
  clearUserIdToDelete,
}: UseUsersActionsParams) {
  const t = useTranslations()

  const updateProfileMutation = useUpdateAdminUserProfile()
  const changeEmailMutation = useChangeAdminUserEmail()
  const deleteUserMutation = useDeleteAdminUser()
  const updateStatusMutation = useUpdateAdminUserStatus()
  const assignWarehouseMutation = useUsersWarehouseAssignments()
  const removeWarehouseMutation = useUsersWarehouseAssignmentsDelete()

  const confirmDeleteUser = () => {
    if (userIdToDelete === null) {
      return
    }

    deleteUserMutation.mutate(userIdToDelete, {
      onSuccess: () => {
        clearUserIdToDelete()
        toast.success(t("generated.admin.users.userBeenDeleted"))
      },
      onError: () => {
        toast.error(t("generated.admin.users.failedDeleteUser"))
      },
    })
  }

  const changeUserStatus = ({
    userId,
    status,
    reason,
  }: {
    userId: number
    status: AccountStatus
    reason?: string
  }) => {
    updateStatusMutation.mutate(
      { userId, status, reason },
      {
        onSuccess: () => {
          toast.success(t("generated.admin.users.usersStatusBeenChanged"))
        },
        onError: () => {
          toast.error(t("generated.admin.users.failedChangeUserStatus"))
        },
      }
    )
  }

  const assignWarehouse = ({
    userId,
    warehouseId,
  }: {
    userId: number
    warehouseId: number
  }) => {
    assignWarehouseMutation.mutate(
      { userId, warehouseId },
      {
        onSuccess: () => {
          toast.success(t("generated.admin.users.warehouseBeenAssignedUser"))
        },
        onError: () => {
          toast.error(t("generated.admin.users.failedAssignWarehouse"))
        },
      }
    )
  }

  const removeWarehouseAssignment = ({
    userId,
    warehouseId,
  }: {
    userId: number
    warehouseId: number
  }) => {
    removeWarehouseMutation.mutate(
      { userId, warehouseId },
      {
        onSuccess: () => {
          toast.success(
            t("generated.admin.users.warehouseAssignmentBeenDeleted")
          )
        },
        onError: () => {
          toast.error(t("generated.admin.users.failedDeleteStorageAssignment"))
        },
      }
    )
  }

  const handleSubmitUser = async ({ id, values }: SubmitUserParams) => {
    const currentUser = users.find((user) => user.id === id)
    if (!currentUser) {
      return
    }

    const nextEmail = values.email.trim()
    const nextFullName = values.fullName.trim()
    const nextPhone = values.phone.trim()
    const nextLocation = values.location.trim()
    const nextTeam = values.team.trim()
    const nextRole = values.role

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
      nextTeam !== currentTeam ||
      nextRole !== currentUser.role

    if (!(didEmailChange || didProfileChange)) {
      return
    }

    if (didEmailChange) {
      await changeEmailMutation.mutateAsync(
        {
          userId: id,
          body: createEmailPayload(nextEmail),
        },
        {
          onSuccess: () => {
            toast.success(t("generated.admin.users.usersEmailBeenUpdated"))
          },
          onError: () => {
            toast.error(t("generated.admin.users.failedUpdateUserEmail"))
          },
        }
      )
    }

    if (didProfileChange) {
      await updateProfileMutation.mutateAsync(
        {
          userId: id,
          body: createProfilePayload({
            fullName: nextFullName,
            phone: nextPhone,
            location: nextLocation,
            selectedTeam: selectedTeamOption,
            role: nextRole,
          }),
        },
        {
          onSuccess: () => {
            toast.success(t("generated.admin.users.userProfileBeenUpdated"))
          },
          onError: () => {
            toast.error(t("generated.admin.users.failedUpdateUserProfile"))
          },
        }
      )
    }
  }

  return {
    confirmDeleteUser,
    handleSubmitUser,
    changeUserStatus,
    assignWarehouse,
    removeWarehouseAssignment,
  }
}
