import {
  Location04Icon,
  Mail01Icon,
  SmartPhone01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { format } from "date-fns"
import { useLocale } from "next-intl"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getDateFnsLocale } from "@/i18n/date-fns-locale"
import { useAppTranslations } from "@/i18n/use-translations"
import type { User } from "@/lib/schemas"
import type { IconComponent } from "../types"
import { getRoleLabels, getStatusConfig } from "./constants"
import type { ProfileDetail } from "./types"

interface ProfileSectionProps {
  user: User
}
type DateFnsLocale = ReturnType<typeof getDateFnsLocale>
const INITIALS_REGEX = /\s+/

const getInitialsFromName = ({
  displayName,
  email,
}: {
  displayName: string
  email: string
}): string => {
  const normalizedName = displayName.trim()
  if (!normalizedName) {
    return email.charAt(0).toUpperCase() || "U"
  }

  const initials = normalizedName
    .split(INITIALS_REGEX)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)

  return initials || email.charAt(0).toUpperCase() || "U"
}

function ProfileDetailRow({ detail }: { detail: ProfileDetail }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
        {detail.label}
      </dt>
      <dd className="font-medium text-sm">{detail.value}</dd>
    </div>
  )
}

function buildProfileDetails(
  t: ReturnType<typeof useAppTranslations>,
  user: User,
  dateFnsLocale: DateFnsLocale,
  statusConfig: ReturnType<typeof getStatusConfig>,
  roleLabels: ReturnType<typeof getRoleLabels>
): ProfileDetail[] {
  return [
    {
      label: t("generated.dashboard.settings.accountStatus"),
      value: statusConfig[user.account_status].label,
    },
    {
      label: t("generated.shared.role"),
      value: roleLabels[user.role],
    },
    {
      label: t("generated.dashboard.settings.lastLogin"),
      value: format(new Date(user.last_login ?? Date.now()), "EEEE, H:mm", {
        locale: dateFnsLocale,
      }),
    },
  ]
}

export const InitialAvatar = ({ name }: { name: string }) => {
  const initials = getInitialsFromName({
    displayName: name,
    email: "",
  })

  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5 font-semibold text-lg text-primary ring-1 ring-primary/10">
      {initials}
    </div>
  )
}

interface InfoFieldProps {
  icon: IconComponent
  label: string
  value: string
}

function InfoField({ icon, label, value }: InfoFieldProps) {
  return (
    <div className="group flex items-start gap-3 rounded-lg bg-muted/30 p-3 ring-1 ring-border/50 transition-colors hover:bg-muted/50">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background ring-1 ring-border/50">
        <HugeiconsIcon
          className="text-muted-foreground"
          icon={icon}
          size={16}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate font-medium text-sm">{value || "—"}</p>
      </div>
    </div>
  )
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const t = useAppTranslations()

  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)
  const statusConfig = getStatusConfig()
  const roleLabels = getRoleLabels()
  const statusBadge = statusConfig[user.account_status]
  const profileDetails = buildProfileDetails(
    t,
    user,
    dateFnsLocale,
    statusConfig,
    roleLabels
  )
  const displayName =
    user.full_name?.trim() || t("generated.dashboard.settings.username")

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t("generated.dashboard.settings.userProfile")}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {t(
              "generated.dashboard.settings.accountDetailsContactInformationAssigned"
            )}
          </p>
        </div>
        <CardAction>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{roleLabels[user.role]}</Badge>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <InitialAvatar name={displayName} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-lg">{displayName}</p>
            <p className="truncate text-muted-foreground text-sm">
              {user.email}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoField
            icon={Mail01Icon}
            label={t("generated.dashboard.settings.emailAddress")}
            value={user.email}
          />
          <InfoField
            icon={SmartPhone01Icon}
            label={t("generated.shared.phone")}
            value={user.phone ?? "—"}
          />
          <InfoField
            icon={Location04Icon}
            label={t("generated.shared.location")}
            value={user.location ?? "—"}
          />
          <InfoField
            icon={UserGroupIcon}
            label={t("generated.shared.team")}
            value={user.team ?? "—"}
          />
        </div>

        <Separator />

        <div>
          <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {t("generated.dashboard.settings.systemInformation")}
          </p>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {profileDetails.map((detail) => (
              <ProfileDetailRow detail={detail} key={detail.label} />
            ))}
          </dl>
        </div>

        <div className="rounded-lg border border-muted-foreground/30 border-dashed bg-muted/20 px-4 py-3">
          <p className="text-muted-foreground text-xs">
            {t(
              "generated.dashboard.settings.profileDataManagedSystemAdministrator"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
