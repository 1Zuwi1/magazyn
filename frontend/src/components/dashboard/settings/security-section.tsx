"use client"

import { useState } from "react"
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
import { TwoFactorSetup } from "./two-factor-setup"
import type { TwoFactorMethod, TwoFactorStatus } from "./types"

interface SecuritySectionProps {
  initialTwoFactorEnabled: boolean
}

export function SecuritySection({
  initialTwoFactorEnabled,
}: SecuritySectionProps) {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>(
    initialTwoFactorEnabled ? "enabled" : "disabled"
  )
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>(
    TWO_FACTOR_METHODS[0].value
  )
  const twoFactorSetupActive = twoFactorStatus === "setup"
  const verificationRequired = twoFactorStatus === "enabled"

  return (
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
            method={twoFactorMethod}
            onMethodChange={setTwoFactorMethod}
            onStatusChange={setTwoFactorStatus}
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
        twoFactorMethod={twoFactorMethod}
        verificationRequired={verificationRequired}
      />
    </div>
  )
}
