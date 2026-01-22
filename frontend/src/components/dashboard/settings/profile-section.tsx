import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { MOCK_PROFILE_FORM, ROLE_LABELS, STATUS_CONFIG } from "./constants"
import type { ProfileDetail, SettingsUser } from "./types"

interface ProfileSectionProps {
  user: SettingsUser
  profileNote: string
  onProfileSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

function ProfileDetailRow({ detail }: { detail: ProfileDetail }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs uppercase">
        {detail.label}
      </dt>
      <dd className="font-medium">{detail.value}</dd>
    </div>
  )
}

function buildProfileDetails(user: SettingsUser): ProfileDetail[] {
  return [
    {
      label: "ID użytkownika",
      value: `${user.id}`,
    },
    {
      label: "Status konta",
      value: STATUS_CONFIG[user.status].label,
    },
    {
      label: "Rola",
      value: ROLE_LABELS[user.role],
    },
    {
      label: "Plan",
      value: "Business",
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

export function ProfileSection({
  user,
  profileNote,
  onProfileSubmit,
}: ProfileSectionProps) {
  const statusBadge = STATUS_CONFIG[user.status]
  const profileDetails = buildProfileDetails(user)
  const displayName = user.fullName ?? "Brak uzupełnionego imienia"

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Profil użytkownika</CardTitle>
          <p className="text-muted-foreground text-sm">
            Podstawowe dane kontaktowe oraz role dostępu.
          </p>
        </div>
        <CardAction>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
        </CardAction>
      </CardHeader>
      <form onSubmit={onProfileSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <p className="font-semibold text-lg">{displayName}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full-name">Imię i nazwisko</Label>
              <Input
                autoComplete="name"
                defaultValue={user.fullName ?? ""}
                id="full-name"
                placeholder="Wpisz imię i nazwisko"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                autoComplete="email"
                defaultValue={user.email}
                id="email"
                placeholder="Wpisz adres e-mail"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                autoComplete="tel"
                defaultValue={MOCK_PROFILE_FORM.phone}
                id="phone"
                placeholder="Wpisz numer telefonu"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Firma</Label>
              <Input
                autoComplete="organization"
                defaultValue={MOCK_PROFILE_FORM.company}
                id="company"
                placeholder="Nazwa firmy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lokalizacja</Label>
              <Input
                autoComplete="address-level2"
                defaultValue={MOCK_PROFILE_FORM.location}
                id="location"
                placeholder="Miasto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Zespół</Label>
              <Input
                defaultValue={MOCK_PROFILE_FORM.team}
                id="team"
                placeholder="Dział lub zespół"
              />
            </div>
          </div>

          <Separator />

          <dl className="grid gap-4 sm:grid-cols-2">
            {profileDetails.map((detail) => (
              <ProfileDetailRow detail={detail} key={detail.label} />
            ))}
          </dl>

          {profileNote ? (
            <p className="text-muted-foreground text-sm">{profileNote}</p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end gap-3">
          <Button type="button" variant="outline">
            Anuluj
          </Button>
          <Button type="submit">Zapisz profil</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
