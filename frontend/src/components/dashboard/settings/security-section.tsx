"use client"

import { Key01Icon, LockIcon, Shield01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TWO_FACTOR_METHODS } from "./constants"
import { PasskeysSection } from "./passkeys-section"
import { PasswordSection } from "./password-section"
import { TwoFactorSetup } from "./two-factor-setup"
import type { TwoFactorMethod, TwoFactorStatus } from "./types"

interface SecuritySectionProps {
  initialTwoFactorEnabled: boolean
  userEmail: string
}

function SecurityStatusIndicator({ status }: { status: TwoFactorStatus }) {
  const config = {
    enabled: {
      label: "Chronione",
      variant: "success" as const,
      icon: Shield01Icon,
    },
    setup: {
      label: "Konfiguracja",
      variant: "warning" as const,
      icon: Key01Icon,
    },
    disabled: {
      label: "Podstawowe",
      variant: "secondary" as const,
      icon: LockIcon,
    },
  }

  const { label, variant, icon } = config[status]

  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant}>
        <HugeiconsIcon icon={icon} size={12} />
        <span className="ml-1">{label}</span>
      </Badge>
    </div>
  )
}

export function SecuritySection({
  initialTwoFactorEnabled,
  userEmail,
}: SecuritySectionProps) {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>(
    initialTwoFactorEnabled ? "enabled" : "disabled"
  )
  // FIXME: In production this should be fetched from user settings
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>(
    TWO_FACTOR_METHODS[0].value
  )
  const verificationRequired = twoFactorStatus === "enabled"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <HugeiconsIcon
                    className="text-primary"
                    icon={Shield01Icon}
                    size={16}
                  />
                </div>
                Weryfikacja dwuetapowa
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Chroń swoje konto dodatkową warstwą zabezpieczeń.
              </p>
            </div>
            <SecurityStatusIndicator status={twoFactorStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup
            method={twoFactorMethod}
            onMethodChange={setTwoFactorMethod}
            onStatusChange={setTwoFactorStatus}
            status={twoFactorStatus}
            userEmail={userEmail}
          />
        </CardContent>
      </Card>

      <PasskeysSection />

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <HugeiconsIcon
                className="text-muted-foreground"
                icon={Key01Icon}
                size={16}
              />
            </div>
            <div className="space-y-1">
              <CardTitle>Zmiana hasła</CardTitle>
              <p className="text-muted-foreground text-sm">
                Regularnie aktualizuj hasło dla bezpieczeństwa.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PasswordSection
            twoFactorMethod={twoFactorMethod}
            verificationRequired={verificationRequired}
          />
        </CardContent>
      </Card>

      <div className="rounded-lg border border-muted-foreground/30 border-dashed bg-muted/20 px-4 py-3">
        <p className="text-muted-foreground text-xs">
          Dla dodatkowego bezpieczeństwa aktywuj weryfikację dwuetapową (2FA).
          Po włączeniu, każde logowanie i zmiana hasła będą wymagać kodu z
          aplikacji uwierzytelniającej lub SMS.
        </p>
      </div>
    </div>
  )
}
