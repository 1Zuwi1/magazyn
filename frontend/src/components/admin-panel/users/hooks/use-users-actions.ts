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
} from "@/hooks/use-admin-users"
import type { EditUserFormValues } from "../components/action-dialog"
import { normalizeValue, resolveTeamValue } from "../lib/user-utils"

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

  const confirmDeleteUser = () => {
    if (userIdToDelete === null) {
      return
    }

    deleteUserMutation.mutate(userIdToDelete, {
      onSuccess: () => {
        clearUserIdToDelete()
        toast.success("Użytkownik został usunięty")
      },
      onError: () => {
        toast.error("Nie udało się usunąć użytkownika")
      },
    })
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
          body: createProfilePayload({
            fullName: nextFullName,
            phone: nextPhone,
            location: nextLocation,
            selectedTeam: selectedTeamOption,
          }),
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

  return {
    confirmDeleteUser,
    handleSubmitUser,
  }
}
