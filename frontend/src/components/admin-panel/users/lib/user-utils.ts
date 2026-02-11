import type { EditableAdminUser } from "@/components/admin-panel/users/components/action-dialog"
import type { AdminTeamOption, AdminUser } from "@/hooks/use-admin-users"
import type { AppTranslate } from "@/i18n/use-translations"

export const TABLE_PAGE_SIZE = 10

export const getStatusLabel = (
  status: AdminUser["account_status"],
  t: AppTranslate
): string => {
  if (status === "ACTIVE") {
    return t("generated.shared.active")
  }
  if (status === "PENDING_VERIFICATION") {
    return t("generated.admin.users.pending")
  }
  if (status === "LOCKED") {
    return t("generated.shared.blocked")
  }
  if (status === "DISABLED") {
    return t("generated.shared.disabled")
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

  return ""
}

export const createEditableUser = (
  user: Pick<
    AdminUser,
    "id" | "full_name" | "email" | "phone" | "location" | "team" | "role"
  >,
  teams: AdminTeamOption[]
): EditableAdminUser => ({
  id: user.id,
  fullName: normalizeValue(user.full_name),
  email: normalizeValue(user.email),
  phone: normalizeValue(user.phone),
  location: normalizeValue(user.location),
  team: resolveTeamValue(user.team, teams),
  role: user.role,
})
