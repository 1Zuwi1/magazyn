"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type AccountRole = "admin" | "user"
type AccountStatus = "verified" | "unverified" | "banned"
type TwoFactorMethod = "authenticator" | "sms" | "email"
type TwoFactorStatus = "disabled" | "setup" | "enabled"
type TwoFactorSetupStage =
  | "idle"
  | "requesting"
  | "sending"
  | "awaiting"
  | "verifying"
  | "success"
  | "error"
type PasswordVerificationStage =
  | "idle"
  | "sending"
  | "awaiting"
  | "verifying"
  | "verified"
  | "error"

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

interface TwoFactorChallenge {
  sessionId: string
  secret: string
  destination: string
  issuedAt: string
}

interface PasswordChallenge {
  sessionId: string
  destination: string
}

const STATUS_CONFIG = {
  verified: { label: "Zweryfikowane", variant: "success" },
  unverified: { label: "Niezweryfikowane", variant: "warning" },
  banned: { label: "Zablokowane", variant: "destructive" },
} as const

const ROLE_LABELS = {
  admin: "Administrator",
  user: "Użytkownik",
} as const

const TWO_FACTOR_METHODS = [
  {
    value: "authenticator",
    label: "Aplikacja uwierzytelniająca",
    hint: "Rekomendowana metoda dla kont firmowych.",
  },
  {
    value: "sms",
    label: "SMS",
    hint: "Kod wysyłany na numer telefonu.",
  },
  {
    value: "email",
    label: "E-mail",
    hint: "Kod wysyłany na skrzynkę pocztową.",
  },
] as const

const MOCK_PROFILE_FORM = {
  phone: "+48 555 019 203",
  company: "MagazynPro Sp. z o.o.",
  location: "Gdańsk, Polska",
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

const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 30
const NON_DIGIT_REGEX = /\D/g
const MOCK_AUTHENTICATOR_SECRET = "H8X2 Q9LP 4T7Z 1V6K"
const MOCK_TWO_FACTOR_DESTINATIONS = {
  sms: "+48 *** *** 203",
  email: "a***@magazynpro.pl",
} as const
const QR_PATTERN = [
  "111111001111",
  "100001001001",
  "101101001101",
  "101101001101",
  "100001001001",
  "111111001111",
  "000000110000",
  "110011001100",
  "001100110011",
  "110011001100",
  "001100110011",
  "111111001111",
] as const

const wait = async (durationMs: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })

const sanitizeOtpValue = (value: string): string =>
  value.replace(NON_DIGIT_REGEX, "").slice(0, OTP_LENGTH)

const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

const createTwoFactorChallenge = async (
  method: TwoFactorMethod
): Promise<TwoFactorChallenge> => {
  await wait(900)
  const issuedAt = new Date().toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const destination =
    method === "sms"
      ? MOCK_TWO_FACTOR_DESTINATIONS.sms
      : method === "email"
        ? MOCK_TWO_FACTOR_DESTINATIONS.email
        : "Aplikacja uwierzytelniająca"
  const secret = method === "authenticator" ? MOCK_AUTHENTICATOR_SECRET : "—"

  return {
    sessionId: `setup_${Date.now()}`,
    secret,
    destination,
    issuedAt,
  }
}

const createPasswordChallenge = async (
  method: TwoFactorMethod
): Promise<PasswordChallenge> => {
  await wait(700)
  const destination =
    method === "sms"
      ? MOCK_TWO_FACTOR_DESTINATIONS.sms
      : method === "email"
        ? MOCK_TWO_FACTOR_DESTINATIONS.email
        : "Aplikacja uwierzytelniająca"

  return {
    sessionId: `pwd_${Date.now()}`,
    destination,
  }
}

const sendVerificationCode = async (sessionId: string): Promise<void> => {
  const jitter = Math.min(sessionId.length * 8, 240)
  await wait(1100 + jitter)
}

const verifyOneTimeCode = async (code: string): Promise<boolean> => {
  await wait(900)
  return code.length === OTP_LENGTH
}

const buildProfileDetails = (user: SettingsUser): ProfileDetail[] => [
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

interface OtpInputProps {
  id: string
  onChange: (value: string) => void
  value: string
  disabled?: boolean
}

const OtpInput = ({ id, onChange, value, disabled }: OtpInputProps) => (
  <InputOTP
    containerClassName="gap-2"
    disabled={disabled}
    id={id}
    maxLength={OTP_LENGTH}
    onChange={(raw) => onChange(sanitizeOtpValue(raw))}
    value={value}
  >
    <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:h-9 *:data-[slot=input-otp-slot]:w-8 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-sm">
      <InputOTPSlot index={0} />
      <InputOTPSlot index={1} />
      <InputOTPSlot index={2} />
    </InputOTPGroup>
    <InputOTPSeparator />
    <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:h-9 *:data-[slot=input-otp-slot]:w-8 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-sm">
      <InputOTPSlot index={3} />
      <InputOTPSlot index={4} />
      <InputOTPSlot index={5} />
    </InputOTPGroup>
  </InputOTP>
)

export function SettingsContent({ user }: SettingsContentProps) {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>(
    user.twoFactorEnabled ? "enabled" : "disabled"
  )
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>(
    TWO_FACTOR_METHODS[0].value
  )
  const [twoFactorSetupStage, setTwoFactorSetupStage] =
    useState<TwoFactorSetupStage>("idle")
  const [twoFactorSetupMethod, setTwoFactorSetupMethod] =
    useState<TwoFactorMethod | null>(null)
  const [twoFactorChallenge, setTwoFactorChallenge] =
    useState<TwoFactorChallenge | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState<string>("")
  const [twoFactorError, setTwoFactorError] = useState<string>("")
  const [twoFactorResendCooldown, setTwoFactorResendCooldown] =
    useState<number>(0)
  const [twoFactorSetupNote, setTwoFactorSetupNote] = useState<string>("")
  const [showRecoveryCodes, setShowRecoveryCodes] = useState<boolean>(false)
  const [profileNote, setProfileNote] = useState<string>("")
  const [passwordNote, setPasswordNote] = useState<string>("")
  const [passwordVerificationStage, setPasswordVerificationStage] =
    useState<PasswordVerificationStage>("idle")
  const [passwordVerificationCode, setPasswordVerificationCode] =
    useState<string>("")
  const [passwordVerificationError, setPasswordVerificationError] =
    useState<string>("")
  const [passwordResendCooldown, setPasswordResendCooldown] =
    useState<number>(0)
  const [passwordChallenge, setPasswordChallenge] =
    useState<PasswordChallenge | null>(null)

  const statusBadge = STATUS_CONFIG[user.status]
  const profileDetails = buildProfileDetails(user)
  const displayName = user.fullName ?? "Brak uzupełnionego imienia"
  const twoFactorEnabled = twoFactorStatus === "enabled"
  const twoFactorSetupActive = twoFactorStatus === "setup"
  const twoFactorMethodValue = twoFactorSetupMethod ?? twoFactorMethod
  const activeMethod = TWO_FACTOR_METHODS.find(
    (method) => method.value === twoFactorMethodValue
  )
  const twoFactorStatusBadge =
    twoFactorStatus === "enabled"
      ? ({ label: "Aktywna", variant: "success" } as const)
      : twoFactorStatus === "setup"
        ? ({ label: "Konfiguracja", variant: "warning" } as const)
        : ({ label: "Wyłączona", variant: "secondary" } as const)
  const isTwoFactorBusy =
    twoFactorSetupStage === "requesting" ||
    twoFactorSetupStage === "sending" ||
    twoFactorSetupStage === "verifying"
  const showTwoFactorCodeEntry =
    twoFactorSetupStage === "awaiting" ||
    twoFactorSetupStage === "verifying" ||
    twoFactorSetupStage === "error"
  const canSelectTwoFactorMethod =
    twoFactorStatus === "disabled" && twoFactorSetupStage === "idle"
  const canResendTwoFactorCode =
    twoFactorResendCooldown === 0 && !isTwoFactorBusy
  const passwordVerificationRequired = twoFactorEnabled
  const passwordVerificationComplete = passwordVerificationStage === "verified"
  const passwordMethod = twoFactorMethodValue
  const canShowPasswordCodeInput =
    passwordMethod === "authenticator" ||
    passwordVerificationStage === "awaiting" ||
    passwordVerificationStage === "verifying" ||
    passwordVerificationStage === "error"
  const isPasswordBusy =
    passwordVerificationStage === "sending" ||
    passwordVerificationStage === "verifying"
  const canResendPasswordCode = passwordResendCooldown === 0 && !isPasswordBusy
  const isPasswordChangeBlocked =
    passwordVerificationRequired && !passwordVerificationComplete

  useEffect(() => {
    if (twoFactorResendCooldown <= 0) {
      return
    }

    const timer = setInterval(() => {
      setTwoFactorResendCooldown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [twoFactorResendCooldown])

  useEffect(() => {
    if (passwordResendCooldown <= 0) {
      return
    }

    const timer = setInterval(() => {
      setPasswordResendCooldown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [passwordResendCooldown])

  useEffect(() => {
    if (twoFactorStatus !== "enabled") {
      setPasswordVerificationStage("idle")
      setPasswordVerificationCode("")
      setPasswordVerificationError("")
      setPasswordResendCooldown(0)
      setPasswordChallenge(null)
    }
  }, [twoFactorStatus])

  const handleProfileSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ): void => {
    event.preventDefault()
    setProfileNote("Zapisano lokalnie (mock).")
  }

  const handlePasswordSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ): void => {
    event.preventDefault()
    if (isPasswordChangeBlocked) {
      setPasswordNote("Najpierw potwierdź 2FA, aby zmienić hasło.")
      return
    }
    setPasswordNote("Hasło zaktualizowane lokalnie (mock).")
  }

  const resetTwoFactorFlow = (): void => {
    setTwoFactorSetupStage("idle")
    setTwoFactorSetupMethod(null)
    setTwoFactorChallenge(null)
    setTwoFactorCode("")
    setTwoFactorError("")
    setTwoFactorResendCooldown(0)
    setTwoFactorSetupNote("")
  }

  const startTwoFactorSetup = async (): Promise<void> => {
    if (twoFactorStatus !== "disabled") {
      return
    }

    setTwoFactorStatus("setup")
    setTwoFactorSetupStage("requesting")
    setTwoFactorSetupMethod(twoFactorMethod)
    setTwoFactorCode("")
    setTwoFactorError("")
    setTwoFactorSetupNote("")
    setTwoFactorResendCooldown(0)

    try {
      const challenge = await createTwoFactorChallenge(twoFactorMethod)
      setTwoFactorChallenge(challenge)

      if (twoFactorMethod === "sms" || twoFactorMethod === "email") {
        setTwoFactorSetupStage("sending")
        await sendVerificationCode(challenge.sessionId)
        setTwoFactorSetupStage("awaiting")
        setTwoFactorResendCooldown(RESEND_COOLDOWN_SECONDS)
        return
      }

      setTwoFactorSetupStage("awaiting")
    } catch {
      setTwoFactorSetupStage("error")
      setTwoFactorError(
        "Nie udało się rozpocząć konfiguracji. Spróbuj ponownie."
      )
    }
  }

  const resendTwoFactorCode = async (): Promise<void> => {
    if (!twoFactorChallenge) {
      return
    }

    setTwoFactorSetupStage("sending")
    setTwoFactorError("")

    try {
      await sendVerificationCode(twoFactorChallenge.sessionId)
      setTwoFactorSetupStage("awaiting")
      setTwoFactorResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch {
      setTwoFactorSetupStage("error")
      setTwoFactorError("Nie udało się wysłać kodu. Spróbuj ponownie.")
    }
  }

  const verifyTwoFactorSetup = async (): Promise<void> => {
    if (twoFactorCode.length !== OTP_LENGTH) {
      setTwoFactorError("Wpisz pełny kod weryfikacyjny.")
      return
    }

    setTwoFactorSetupStage("verifying")
    setTwoFactorError("")

    const isValid = await verifyOneTimeCode(twoFactorCode)

    if (isValid) {
      setTwoFactorSetupStage("success")
      setTwoFactorStatus("enabled")
      setShowRecoveryCodes(true)
      setTwoFactorSetupNote(
        "2FA zostało aktywowane. Zapisz kody odzyskiwania i przechowuj je offline."
      )
      return
    }

    setTwoFactorSetupStage("error")
    setTwoFactorError("Kod jest nieprawidłowy. Spróbuj ponownie.")
  }

  const handleTwoFactorToggle = (enabled: boolean): void => {
    if (!enabled) {
      setTwoFactorStatus("disabled")
      resetTwoFactorFlow()
      setShowRecoveryCodes(false)
      return
    }

    if (twoFactorStatus === "disabled") {
      void startTwoFactorSetup()
    }
  }

  const handleTwoFactorMethodChange = (value: string): void => {
    if (twoFactorStatus !== "disabled") {
      return
    }

    if (value === "authenticator" || value === "sms" || value === "email") {
      setTwoFactorMethod(value)
    }
  }

  const handleStartTwoFactorSetup = (): void => {
    void startTwoFactorSetup()
  }

  const handleCancelTwoFactorSetup = (): void => {
    setTwoFactorStatus("disabled")
    resetTwoFactorFlow()
    setShowRecoveryCodes(false)
  }

  const handleResendTwoFactorCode = (): void => {
    void resendTwoFactorCode()
  }

  const handleVerifyTwoFactorCode = (): void => {
    void verifyTwoFactorSetup()
  }

  const requestPasswordCode = async (): Promise<void> => {
    setPasswordVerificationStage("sending")
    setPasswordVerificationError("")
    setPasswordNote("")

    try {
      const challenge = await createPasswordChallenge(passwordMethod)
      setPasswordChallenge(challenge)
      await sendVerificationCode(challenge.sessionId)
      setPasswordVerificationStage("awaiting")
      setPasswordResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch {
      setPasswordVerificationStage("error")
      setPasswordVerificationError(
        "Nie udało się wysłać kodu. Spróbuj ponownie."
      )
    }
  }

  const handleStartPasswordVerification = (): void => {
    if (!passwordVerificationRequired) {
      return
    }

    setPasswordNote("")

    if (passwordMethod === "authenticator") {
      setPasswordVerificationStage("awaiting")
      return
    }

    void requestPasswordCode()
  }

  const handleResendPasswordCode = (): void => {
    if (passwordMethod === "authenticator") {
      return
    }

    void requestPasswordCode()
  }

  const verifyPasswordCode = async (): Promise<void> => {
    if (passwordVerificationCode.length !== OTP_LENGTH) {
      setPasswordVerificationError("Wpisz pełny kod weryfikacyjny.")
      return
    }

    setPasswordVerificationStage("verifying")
    setPasswordVerificationError("")

    const isValid = await verifyOneTimeCode(passwordVerificationCode)

    if (isValid) {
      setPasswordVerificationStage("verified")
      return
    }

    setPasswordVerificationStage("error")
    setPasswordVerificationError("Kod jest nieprawidłowy. Spróbuj ponownie.")
  }

  const handleVerifyPasswordCode = (): void => {
    void verifyPasswordCode()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Ustawienia konta</h1>
        <p className="text-muted-foreground">
          Zarządzaj profilem, bezpieczeństwem i powiadomieniami konta.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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
              <CardTitle>Bezpieczeństwo</CardTitle>
              <p className="text-muted-foreground text-sm">
                Włącz dodatkowe zabezpieczenia dla konta.
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
                    Potwierdzaj logowanie i zmianę hasła dodatkowym kodem.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch
                    aria-describedby="two-factor-description"
                    checked={twoFactorStatus !== "disabled"}
                    disabled={isTwoFactorBusy}
                    id="two-factor"
                    onCheckedChange={handleTwoFactorToggle}
                  />
                  <Badge variant={twoFactorStatusBadge.variant}>
                    {twoFactorStatusBadge.label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">Konfiguracja 2FA</p>
                    <p className="text-muted-foreground text-sm">
                      Dodaj drugi krok weryfikacji i chroń krytyczne działania.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {twoFactorStatus === "disabled" ? (
                      <Button
                        isLoading={twoFactorSetupStage === "requesting"}
                        onClick={handleStartTwoFactorSetup}
                        type="button"
                      >
                        Rozpocznij konfigurację
                      </Button>
                    ) : null}
                    {twoFactorStatus === "setup" ? (
                      <Button
                        onClick={handleCancelTwoFactorSetup}
                        type="button"
                        variant="outline"
                      >
                        Anuluj konfigurację
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 text-muted-foreground text-xs sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        twoFactorStatus !== "disabled" ? "success" : "outline"
                      }
                    >
                      1
                    </Badge>
                    <span>Wybierz metodę</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        twoFactorStatus === "enabled" || showTwoFactorCodeEntry
                          ? "success"
                          : "outline"
                      }
                    >
                      2
                    </Badge>
                    <span>Potwierdź kod</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        twoFactorStatus === "enabled" ? "success" : "outline"
                      }
                    >
                      3
                    </Badge>
                    <span>Zapisz kody</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="two-factor-method">Metoda weryfikacji</Label>
                  <Select
                    disabled={!canSelectTwoFactorMethod}
                    onValueChange={handleTwoFactorMethodChange}
                    value={twoFactorMethod}
                  >
                    <SelectTrigger className="w-full" id="two-factor-method">
                      <SelectValue
                        render={
                          <span>{activeMethod?.label ?? "Wybierz metodę"}</span>
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

                {twoFactorSetupActive ? (
                  <div className="space-y-4 rounded-lg border bg-background/80 p-4">
                    {twoFactorSetupStage === "requesting" ? (
                      <Alert>
                        <Spinner className="text-muted-foreground" />
                        <AlertTitle>Łączymy się z usługą 2FA</AlertTitle>
                        <AlertDescription>
                          Generujemy klucz i przygotowujemy kolejne kroki.
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    {twoFactorSetupStage === "sending" ? (
                      <Alert>
                        <Spinner className="text-muted-foreground" />
                        <AlertTitle>Wysyłamy kod</AlertTitle>
                        <AlertDescription>
                          Kod trafia na{" "}
                          {twoFactorChallenge?.destination ?? "wybraną metodę"}.
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    {twoFactorSetupStage === "error" && twoFactorError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Nie udało się aktywować 2FA</AlertTitle>
                        <AlertDescription>{twoFactorError}</AlertDescription>
                      </Alert>
                    ) : null}

                    {showTwoFactorCodeEntry ? (
                      <div className="space-y-4">
                        {twoFactorMethodValue === "authenticator" ? (
                          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                            <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-3">
                              <div className="grid grid-cols-12 gap-0.5">
                                {QR_PATTERN.map((row, rowIndex) =>
                                  row
                                    .split("")
                                    .map((cell, cellIndex) => (
                                      <div
                                        className={
                                          cell === "1"
                                            ? "size-2 rounded-[2px] bg-foreground"
                                            : "size-2 rounded-[2px] bg-muted-foreground/15"
                                        }
                                        key={`${rowIndex}-${cellIndex}`}
                                      />
                                    ))
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="font-medium text-sm">
                                Zeskanuj kod QR lub wprowadź sekret
                              </p>
                              <p className="text-muted-foreground text-sm">
                                Użyj aplikacji uwierzytelniającej (np. Google
                                Authenticator, Authy).
                              </p>
                              <Input
                                className="font-mono text-xs"
                                readOnly
                                value={
                                  twoFactorChallenge?.secret ??
                                  MOCK_AUTHENTICATOR_SECRET
                                }
                              />
                              <p className="text-muted-foreground text-xs">
                                Token wygenerowano o{" "}
                                {twoFactorChallenge?.issuedAt ?? "teraz"}.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="font-medium text-sm">
                              Kod jednorazowy
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {twoFactorMethodValue === "sms"
                                ? "SMS z kodem został wysłany."
                                : "E-mail z kodem został wysłany."}{" "}
                              Kontakt:{" "}
                              {twoFactorChallenge?.destination ??
                                "wybrana metoda"}
                              .
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Możesz poprosić o ponowną wysyłkę, jeśli kod nie
                              dotarł.
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          <Label htmlFor="two-factor-code">
                            Kod weryfikacyjny
                          </Label>
                          <OtpInput
                            id="two-factor-code"
                            onChange={setTwoFactorCode}
                            value={twoFactorCode}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              disabled={twoFactorCode.length !== OTP_LENGTH}
                              isLoading={twoFactorSetupStage === "verifying"}
                              onClick={handleVerifyTwoFactorCode}
                              type="button"
                            >
                              Zweryfikuj i aktywuj
                            </Button>
                            {twoFactorMethodValue !== "authenticator" ? (
                              <Button
                                disabled={!canResendTwoFactorCode}
                                onClick={handleResendTwoFactorCode}
                                type="button"
                                variant="outline"
                              >
                                {twoFactorResendCooldown > 0
                                  ? `Wyślij ponownie (${formatCountdown(twoFactorResendCooldown)})`
                                  : "Wyślij ponownie"}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {twoFactorStatus === "enabled" ? (
                  <Alert>
                    <AlertTitle>2FA aktywna</AlertTitle>
                    <AlertDescription>
                      {twoFactorSetupNote ||
                        "Logowanie i zmiana hasła wymagają kodu. Jeśli utracisz dostęp, użyj kodów odzyskiwania."}
                    </AlertDescription>
                  </Alert>
                ) : null}
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
                    {showRecoveryCodes ? "Ukryj" : "Pokaż"}
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
                      ? 'Kliknij "Pokaż", aby wyświetlić kody.'
                      : "Włącz 2FA, aby wygenerować kody."}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                disabled={twoFactorSetupActive}
                type="button"
                variant="secondary"
              >
                Zapisz ustawienia bezpieczeństwa
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zmiana hasła</CardTitle>
              <p className="text-muted-foreground text-sm">
                Użyj silnego hasła, aby zabezpieczyć konto.
              </p>
            </CardHeader>
            <form onSubmit={handlePasswordSubmit}>
              <CardContent className="space-y-4">
                {passwordVerificationRequired ? (
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">
                          Potwierdź 2FA przed zmianą
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {passwordMethod === "authenticator"
                            ? "Wpisz kod z aplikacji uwierzytelniającej."
                            : `Wyślemy kod na ${passwordChallenge?.destination ?? activeMethod?.label ?? "wybraną metodę"}.`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          passwordVerificationComplete ? "success" : "warning"
                        }
                      >
                        {passwordVerificationComplete
                          ? "Zweryfikowano"
                          : "Wymagane"}
                      </Badge>
                    </div>

                    {passwordVerificationComplete ? (
                      <Alert>
                        <AlertTitle>Zweryfikowano</AlertTitle>
                        <AlertDescription>
                          Możesz bezpiecznie zmienić hasło.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-3">
                        {passwordMethod !== "authenticator" &&
                        passwordVerificationStage === "idle" ? (
                          <Button
                            isLoading={passwordVerificationStage === "sending"}
                            onClick={handleStartPasswordVerification}
                            type="button"
                            variant="outline"
                          >
                            Wyślij kod
                          </Button>
                        ) : null}

                        {passwordVerificationStage === "sending" ? (
                          <Alert>
                            <Spinner className="text-muted-foreground" />
                            <AlertTitle>Wysyłamy kod</AlertTitle>
                            <AlertDescription>
                              Kod trafia na{" "}
                              {passwordChallenge?.destination ??
                                "wybraną metodę"}
                              .
                            </AlertDescription>
                          </Alert>
                        ) : null}

                        {canShowPasswordCodeInput ? (
                          <div className="space-y-3">
                            <Label htmlFor="password-2fa-code">Kod 2FA</Label>
                            <OtpInput
                              id="password-2fa-code"
                              onChange={setPasswordVerificationCode}
                              value={passwordVerificationCode}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                disabled={
                                  passwordVerificationCode.length !== OTP_LENGTH
                                }
                                isLoading={
                                  passwordVerificationStage === "verifying"
                                }
                                onClick={handleVerifyPasswordCode}
                                type="button"
                              >
                                Zweryfikuj kod
                              </Button>
                              {passwordMethod !== "authenticator" ? (
                                <Button
                                  disabled={!canResendPasswordCode}
                                  onClick={handleResendPasswordCode}
                                  type="button"
                                  variant="outline"
                                >
                                  {passwordResendCooldown > 0
                                    ? `Wyślij ponownie (${formatCountdown(passwordResendCooldown)})`
                                    : "Wyślij ponownie"}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        {passwordVerificationStage === "error" &&
                        passwordVerificationError ? (
                          <Alert variant="destructive">
                            <AlertTitle>Nie udało się zweryfikować</AlertTitle>
                            <AlertDescription>
                              {passwordVerificationError}
                            </AlertDescription>
                          </Alert>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="current-password">Obecne hasło</Label>
                  <Input
                    autoComplete="current-password"
                    disabled={isPasswordChangeBlocked}
                    id="current-password"
                    placeholder="Wprowadź obecne hasło"
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nowe hasło</Label>
                  <Input
                    autoComplete="new-password"
                    disabled={isPasswordChangeBlocked}
                    id="new-password"
                    placeholder="Co najmniej 8 znaków"
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Potwierdź hasło</Label>
                  <Input
                    autoComplete="new-password"
                    disabled={isPasswordChangeBlocked}
                    id="confirm-password"
                    placeholder="Powtórz nowe hasło"
                    type="password"
                  />
                </div>
                <p className="text-muted-foreground text-sm">
                  Użyj min. 8 znaków, w tym cyfr i znaków specjalnych.
                </p>
                {passwordNote ? (
                  <p className="text-muted-foreground text-sm">
                    {passwordNote}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="justify-end">
                <Button disabled={isPasswordChangeBlocked} type="submit">
                  Zmień hasło
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
