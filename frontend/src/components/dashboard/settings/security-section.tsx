"use client"

import { Key01Icon, LockIcon, Shield01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TwoFactorMethod } from "@/lib/schemas"
import { PasskeysSection } from "./passkeys-section"
import { PasswordSection } from "./password-section"
import { TwoFactorSetup } from "./two-factor-setup"
import type { TwoFactorStatus } from "./types"

interface SecuritySectionProps {
  userEmail: string
  backupCodesRefreshNeeded: boolean
}

function SecurityStatusIndicator({ status }: { status: TwoFactorStatus }) {
  const t = useTranslations()

  const config = {
    ENABLED: {
      label: t("generated.dashboard.settings.protected"),
      variant: "success" as const,
      icon: Shield01Icon,
    },
    SETUP: {
      label: t("generated.dashboard.settings.configuration"),
      variant: "warning" as const,
      icon: Key01Icon,
    },
    DISABLED: {
      label: t("generated.dashboard.settings.basic"),
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
  userEmail,
  backupCodesRefreshNeeded,
}: SecuritySectionProps) {
  const t = useTranslations()

  const [twoFactorMethod, setTwoFactorMethod] =
    useState<TwoFactorMethod>("EMAIL")

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
                {t("generated.dashboard.settings.twoStepVerification")}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {t(
                  "generated.dashboard.settings.protectAccountExtraLayerSecurity"
                )}
              </p>
            </div>
            <SecurityStatusIndicator status="ENABLED" />
          </div>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup
            backupCodesRefreshNeeded={backupCodesRefreshNeeded}
            method={twoFactorMethod}
            onMethodChange={setTwoFactorMethod}
            status="ENABLED"
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
              <CardTitle>
                {t("generated.dashboard.settings.changingPassword")}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {t(
                  "generated.dashboard.settings.updatePasswordRegularlySecurity"
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PasswordSection />
        </CardContent>
      </Card>
    </div>
  )
}
