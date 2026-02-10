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
import { translateMessage } from "@/i18n/translate-message"
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
}: {
  fullName: string
  phone: string
  location: string
  selectedTeam?: AdminTeamOption
}): UpdateAdminUserProfileInput => ({
  fullName: fullName || undefined,
  phone: phone || undefined,
  location: location || undefined,
  team: selectedTeam?.value,
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
        toast.success(translateMessage("generated.m0303"))
      },
      onError: () => {
        toast.error(translateMessage("generated.m0304"))
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
          toast.success(translateMessage("generated.m0305"))
        },
        onError: () => {
          toast.error(translateMessage("generated.m0306"))
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
          toast.success(translateMessage("generated.m0307"))
        },
        onError: () => {
          toast.error(translateMessage("generated.m0308"))
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
          toast.success(translateMessage("generated.m0309"))
        },
        onError: () => {
          toast.error(translateMessage("generated.m0310"))
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
          body: createEmailPayload(nextEmail),
        },
        {
          onSuccess: () => {
            toast.success(translateMessage("generated.m0311"))
          },
          onError: () => {
            toast.error(translateMessage("generated.m0312"))
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
          }),
        },
        {
          onSuccess: () => {
            toast.success(translateMessage("generated.m0313"))
          },
          onError: () => {
            toast.error(translateMessage("generated.m0314"))
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
