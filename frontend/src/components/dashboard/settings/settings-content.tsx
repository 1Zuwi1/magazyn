"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type AccountRole = "admin" | "user"
type AccountStatus = "verified" | "unverified" | "banned"
type TwoFactorMethod = "authenticator" | "sms" | "email"

interface SettingsUser {
  id: number
  email: string
  fullName: string | null
  role: AccountRole
  status: AccountStatus
  twoFactorEnabled: boolean
}

interface SettingsContentProps {
  user: SettingsUser
}

interface ProfileDetail {
  label: string
  value: string
}

const STATUS_CONFIG = {
  verified: { label: "Zweryfikowane", variant: "success" },
  unverified: { label: "Niezweryfikowane", variant: "warning" },
  banned: { label: "Zablokowane", variant: "destructive" },
} as const

const ROLE_LABELS = {
  admin: "Administrator",
  user: "Uzytkownik",
} as const

const TWO_FACTOR_METHODS = [
  {
    value: "authenticator",
    label: "Aplikacja uwierzytelniajaca",
    hint: "Rekomendowana metoda dla kont firmowych.",
  },
  {
    value: "sms",
    label: "SMS",
    hint: "Kod wysylany na numer telefonu.",
  },
  {
    value: "email",
    label: "Email",
    hint: "Kod wysylany na skrzynke pocztowa.",
  },
] as const

const MOCK_PROFILE_FORM = {
  phone: "+48 555 019 203",
  company: "MagazynPro Sp. z o.o.",
  location: "Gdansk, Polska",
  team: "Operacje magazynowe",
} as const

const RECOVERY_CODES = [
  "7DFK-93NX",
  "3H2P-YZ8V",
  "K9LQ-5VTX",
  "6QRP-1CZ4",
  "T8WM-2HNK",
  "M0QJ-8D3R",
  "NL7C-44PD",
  "2VXR-G1U6",
  "X6ZP-9S2L",
  "R3JD-5FQ8",
] as const

const buildProfileDetails = (user: SettingsUser): ProfileDetail[] => [
  {
    label: "ID uzytkownika",
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
    value: "Dzis, 08:42",
  },
  {
    label: "Strefa czasowa",
    value: "Europe/Warsaw",
  },
]

export function SettingsContent({ user }: SettingsContentProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(
    user.twoFactorEnabled
  )
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>(
    TWO_FACTOR_METHODS[0].value
  )
  const [showRecoveryCodes, setShowRecoveryCodes] = useState<boolean>(false)
  const [profileNote, setProfileNote] = useState<string>("")
  const [passwordNote, setPasswordNote] = useState<string>("")

  const statusBadge = STATUS_CONFIG[user.status]
  const profileDetails = buildProfileDetails(user)
  const displayName = user.fullName ?? "Brak uzupelnionego imienia"

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileNote("Zapisano lokalnie (mock).")
  }

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordNote("Haslo zaktualizowane lokalnie (mock).")
  }

  const handleTwoFactorToggle = (enabled: boolean): void => {
    setTwoFactorEnabled(enabled)
    if (!enabled) {
      setShowRecoveryCodes(false)
    }
  }

  const handleTwoFactorMethodChange = (value: TwoFactorMethod | null): void => {
    if (value) {
      setTwoFactorMethod(value)
    }
  }

  const activeMethod = TWO_FACTOR_METHODS.find(
    (method) => method.value === twoFactorMethod
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Ustawienia konta</h1>
        <p className="text-muted-foreground">
          Zarzadzaj profilem, bezpieczenstwem i powiadomieniami konta.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Profil uzytkownika</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Podstawowe dane kontaktowe oraz role dostepu.
                </p>
              </div>
              <CardAction>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                  <Badge variant={statusBadge.variant}>
                    {statusBadge.label}
                  </Badge>
                </div>
              </CardAction>
            </CardHeader>
            <form onSubmit={handleProfileSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{displayName}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Imie i nazwisko</Label>
                    <Input
                      autoComplete="name"
                      defaultValue={user.fullName ?? ""}
                      id="full-name"
                      placeholder="Wpisz imie i nazwisko"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      autoComplete="email"
                      defaultValue={user.email}
                      id="email"
                      placeholder="Wpisz adres email"
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
                    <Label htmlFor="team">Zespol</Label>
                    <Input
                      defaultValue={MOCK_PROFILE_FORM.team}
                      id="team"
                      placeholder="Dzial lub zespol"
                    />
                  </div>
                </div>

                <Separator />

                <dl className="grid gap-4 sm:grid-cols-2">
                  {profileDetails.map((detail) => (
                    <div className="space-y-1" key={detail.label}>
                      <dt className="text-muted-foreground text-xs uppercase">
                        {detail.label}
                      </dt>
                      <dd className="font-medium">{detail.value}</dd>
                    </div>
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bezpieczenstwo</CardTitle>
              <p className="text-muted-foreground text-sm">
                Wlacz dodatkowe zabezpieczenia dla konta.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="two-factor">Weryfikacja 2FA</Label>
                  <p
                    className="text-muted-foreground text-sm"
                    id="two-factor-description"
                  >
                    Potwierdzaj logowanie dodatkowym kodem.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch
                    aria-describedby="two-factor-description"
                    checked={twoFactorEnabled}
                    id="two-factor"
                    onCheckedChange={handleTwoFactorToggle}
                  />
                  <Badge variant={twoFactorEnabled ? "success" : "secondary"}>
                    {twoFactorEnabled ? "Aktywna" : "Wylaczona"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="two-factor-method">Metoda weryfikacji</Label>
                <Select
                  disabled={!twoFactorEnabled}
                  onValueChange={handleTwoFactorMethodChange}
                  value={twoFactorMethod}
                >
                  <SelectTrigger className="w-full" id="two-factor-method">
                    <SelectValue
                      render={
                        <span>{activeMethod?.label ?? "Wybierz metode"}</span>
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {TWO_FACTOR_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <span className="font-medium">{method.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm">
                  {activeMethod?.hint}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="recovery-codes">Kody odzyskiwania</Label>
                    <p className="text-muted-foreground text-sm">
                      Przechowuj je w bezpiecznym miejscu.
                    </p>
                  </div>
                  <Button
                    disabled={!twoFactorEnabled}
                    onClick={() => setShowRecoveryCodes((prev) => !prev)}
                    type="button"
                    variant="outline"
                  >
                    {showRecoveryCodes ? "Ukryj" : "Pokaz"}
                  </Button>
                </div>

                {showRecoveryCodes ? (
                  <Textarea
                    className="min-h-28"
                    id="recovery-codes"
                    readOnly
                    value={RECOVERY_CODES.join("\n")}
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {twoFactorEnabled
                      ? 'Kliknij "Pokaz", aby wyswietlic kody.'
                      : "Wlacz 2FA, aby wygenerowac kody."}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="button" variant="secondary">
                Zapisz ustawienia bezpieczenstwa
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zmiana hasla</CardTitle>
              <p className="text-muted-foreground text-sm">
                Uzyj silnego hasla, aby zabezpieczyc konto.
              </p>
            </CardHeader>
            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Obecne haslo</Label>
                  <Input
                    autoComplete="current-password"
                    id="current-password"
                    placeholder="Wprowadz obecne haslo"
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nowe haslo</Label>
                  <Input
                    autoComplete="new-password"
                    id="new-password"
                    placeholder="Co najmniej 8 znakow"
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Potwierdz haslo</Label>
                  <Input
                    autoComplete="new-password"
                    id="confirm-password"
                    placeholder="Powtorz nowe haslo"
                    type="password"
                  />
                </div>
                <p className="text-muted-foreground text-sm">
                  Uzyj min. 8 znakow, w tym cyfr i znakow specjalnych.
                </p>
                {passwordNote ? (
                  <p className="text-muted-foreground text-sm">
                    {passwordNote}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit">Zmien haslo</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
