"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TWO_FACTOR_METHODS } from "./constants"
import { PasswordSection } from "./password-section"
import { ProfileSection } from "./profile-section"
import { TwoFactorSetup } from "./two-factor-setup"
import type {
  PasswordChallenge,
  PasswordVerificationStage,
  TwoFactorChallenge,
  TwoFactorMethod,
  TwoFactorSetupStage,
  TwoFactorStatus,
} from "./types"

interface SettingsContentProps {
  user: {
    id: number
    email: string
    fullName: string | null
    role: "admin" | "user"
    status: "verified" | "unverified" | "banned"
    twoFactorEnabled: boolean
  }
}

export function SettingsContent({ user }: SettingsContentProps) {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>(
    user.twoFactorEnabled ? "enabled" : "disabled"
  )
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>(
    TWO_FACTOR_METHODS[0].value
  )
  const [twoFactorSetupStage, setTwoFactorSetupStage] =
    useState<TwoFactorSetupStage>("idle")
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

  const twoFactorEnabled = twoFactorStatus === "enabled"
  const twoFactorSetupActive = twoFactorStatus === "setup"
  const passwordVerificationRequired = twoFactorEnabled
  const passwordVerificationComplete = passwordVerificationStage === "verified"
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
          <ProfileSection
            onProfileSubmit={handleProfileSubmit}
            profileNote={profileNote}
            user={user}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bezpieczeństwo</CardTitle>
              <p className="text-muted-foreground text-sm">
                Włącz dodatkowe zabezpieczenia dla konta.
              </p>
            </CardHeader>
            <CardContent>
              <TwoFactorSetup
                challenge={twoFactorChallenge}
                code={twoFactorCode}
                error={twoFactorError}
                method={twoFactorMethod}
                onChallengeChange={setTwoFactorChallenge}
                onCodeChange={setTwoFactorCode}
                onErrorChange={setTwoFactorError}
                onMethodChange={setTwoFactorMethod}
                onResendCooldownChange={setTwoFactorResendCooldown}
                onSetupNoteChange={setTwoFactorSetupNote}
                onShowRecoveryCodesChange={setShowRecoveryCodes}
                onStageChange={setTwoFactorSetupStage}
                onStatusChange={setTwoFactorStatus}
                resendCooldown={twoFactorResendCooldown}
                setupNote={twoFactorSetupNote}
                setupStage={twoFactorSetupStage}
                showRecoveryCodes={showRecoveryCodes}
                status={twoFactorStatus}
              />
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

          <PasswordSection
            challenge={passwordChallenge}
            onChallengeChange={setPasswordChallenge}
            onCodeChange={setPasswordVerificationCode}
            onErrorChange={setPasswordVerificationError}
            onPasswordSubmit={handlePasswordSubmit}
            onResendCooldownChange={setPasswordResendCooldown}
            onStageChange={setPasswordVerificationStage}
            passwordNote={passwordNote}
            resendCooldown={passwordResendCooldown}
            twoFactorMethod={twoFactorMethod}
            verificationBlocked={isPasswordChangeBlocked}
            verificationCode={passwordVerificationCode}
            verificationComplete={passwordVerificationComplete}
            verificationError={passwordVerificationError}
            verificationRequired={passwordVerificationRequired}
            verificationStage={passwordVerificationStage}
          />
        </div>
      </div>
    </div>
  )
}
