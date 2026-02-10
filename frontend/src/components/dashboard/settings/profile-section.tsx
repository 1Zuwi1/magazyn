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
import { translateMessage } from "@/i18n/translate-message"
import type { User } from "@/lib/schemas"
import type { IconComponent } from "../types"
import { ROLE_LABELS, STATUS_CONFIG } from "./constants"
import type { ProfileDetail } from "./types"

interface ProfileSectionProps {
  user: User
}
type DateFnsLocale = ReturnType<typeof getDateFnsLocale>

const FALLBACK_DISPLAY_NAME = translateMessage("generated.m0570")
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
  user: User,
  dateFnsLocale: DateFnsLocale
): ProfileDetail[] {
  return [
    {
      label: translateMessage("generated.m0571"),
      value: STATUS_CONFIG[user.account_status].label,
    },
    {
      label: translateMessage("generated.m0942"),
      value: ROLE_LABELS[user.role],
    },
    {
      label: translateMessage("generated.m0572"),
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
  const locale = useLocale()
  const dateFnsLocale = getDateFnsLocale(locale)
  const statusBadge = STATUS_CONFIG[user.account_status]
  const profileDetails = buildProfileDetails(user, dateFnsLocale)
  const displayName = user.full_name?.trim() || FALLBACK_DISPLAY_NAME

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{translateMessage("generated.m0573")}</CardTitle>
          <p className="text-muted-foreground text-sm">
            {translateMessage("generated.m0574")}
          </p>
        </div>
        <CardAction>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
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
            label={translateMessage("generated.m0575")}
            value={user.email}
          />
          <InfoField
            icon={SmartPhone01Icon}
            label={translateMessage("generated.m0940")}
            value={user.phone ?? "—"}
          />
          <InfoField
            icon={Location04Icon}
            label={translateMessage("generated.m0893")}
            value={user.location ?? "—"}
          />
          <InfoField
            icon={UserGroupIcon}
            label={translateMessage("generated.m0272")}
            value={user.team ?? "—"}
          />
        </div>

        <Separator />

        <div>
          <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {translateMessage("generated.m0576")}
          </p>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {profileDetails.map((detail) => (
              <ProfileDetailRow detail={detail} key={detail.label} />
            ))}
          </dl>
        </div>

        <div className="rounded-lg border border-muted-foreground/30 border-dashed bg-muted/20 px-4 py-3">
          <p className="text-muted-foreground text-xs">
            {translateMessage("generated.m0577")}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
