import {
  Location04Icon,
  Mail01Icon,
  SmartPhone01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { User } from "@/lib/schemas"
import { ROLE_LABELS, STATUS_CONFIG } from "./constants"
import type { ProfileDetail } from "./types"

interface ProfileSectionProps {
  user: User
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

function buildProfileDetails(user: User): ProfileDetail[] {
  console.log(user)
  return [
    {
      label: "Status konta",
      value: STATUS_CONFIG[user.account_status].label,
    },
    {
      label: "Rola",
      value: ROLE_LABELS[user.role],
    },
    {
      label: "Ostatnie logowanie",
      value: "Dziś, 08:42",
    },
    {
      label: "Strefa czasowa",
      value: "Europe/Warsaw",
    },
  ]
}

interface InfoFieldProps {
  icon: typeof Mail01Icon
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
  const statusBadge = STATUS_CONFIG[user.account_status]
  const profileDetails = buildProfileDetails(user)
  const displayName = user.full_name ?? "Brak uzupełnionego imienia"

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Profil użytkownika</CardTitle>
          <p className="text-muted-foreground text-sm">
            Dane konta i informacje kontaktowe przypisane przez administratora.
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
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5 font-semibold text-lg text-primary ring-1 ring-primary/10">
            {displayName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
            {/* TODO: Add fallback image when displayName is not available */}
          </div>
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
            label="Adres e-mail"
            value={user.email}
          />
          <InfoField
            icon={SmartPhone01Icon}
            label="Telefon"
            value={user.phone ?? "—"}
          />
          <InfoField
            icon={Location04Icon}
            label="Lokalizacja"
            value={user.location ?? "—"}
          />
          <InfoField
            icon={UserGroupIcon}
            label="Zespół"
            value={user.team ?? "—"}
          />
        </div>

        <Separator />

        <div>
          <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Informacje systemowe
          </p>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {profileDetails.map((detail) => (
              <ProfileDetailRow detail={detail} key={detail.label} />
            ))}
          </dl>
        </div>

        <div className="rounded-lg border border-muted-foreground/30 border-dashed bg-muted/20 px-4 py-3">
          <p className="text-muted-foreground text-xs">
            Dane profilu są zarządzane przez administratora systemu. Jeśli
            potrzebujesz wprowadzić zmiany, skontaktuj się z działem IT.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
