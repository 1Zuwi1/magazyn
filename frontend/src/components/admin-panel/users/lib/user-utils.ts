import type { EditableAdminUser } from "@/components/admin-panel/users/components/action-dialog"
import type { AdminTeamOption, AdminUser } from "@/hooks/use-admin-users"

export const TABLE_PAGE_SIZE = 10

export const getStatusLabel = (status: AdminUser["account_status"]): string => {
  if (status === "ACTIVE") {
    return "Aktywne"
  }
  if (status === "PENDING_VERIFICATION") {
    return "Oczekuje"
  }
  if (status === "LOCKED") {
    return "Zablokowane"
  }
  if (status === "DISABLED") {
    return "Wyłączone"
  }
  return status
}

export const getStatusVariant = (
  status: AdminUser["account_status"]
): "default" | "destructive" | "success" | "secondary" | "outline" => {
  if (status === "ACTIVE") {
    return "success"
  }
  if (status === "LOCKED") {
    return "destructive"
  }
  return "secondary"
}

export const normalizeValue = (value: string | null | undefined): string =>
  value?.trim() ?? ""

export const resolveTeamValue = (
  currentTeam: string | null | undefined,
  teams: AdminTeamOption[]
): string => {
  const normalizedTeam = normalizeValue(currentTeam)

  if (!normalizedTeam) {
    return ""
  }

  const exactValueMatch = teams.find((team) => team.value === normalizedTeam)
  if (exactValueMatch) {
    return exactValueMatch.value
  }

  const labelMatch = teams.find((team) => team.label === normalizedTeam)
  if (labelMatch) {
    return labelMatch.value
  }

  return ""
}

export const createEditableUser = (
  user: Pick<
    AdminUser,
    "id" | "full_name" | "email" | "phone" | "location" | "team"
  >,
  teams: AdminTeamOption[]
): EditableAdminUser => ({
  id: user.id,
  fullName: normalizeValue(user.full_name),
  email: normalizeValue(user.email),
  phone: normalizeValue(user.phone),
  location: normalizeValue(user.location),
  team: resolveTeamValue(user.team, teams),
})
