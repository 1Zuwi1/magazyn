import { ProfileSection } from "./profile-section"
import { SecuritySection } from "./security-section"
import type { SettingsContentProps } from "./types"

export function SettingsContent({ user }: SettingsContentProps) {
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
          <ProfileSection user={user} />
        </div>
        <SecuritySection initialTwoFactorEnabled={user.twoFactorEnabled} />
      </div>
    </div>
  )
}
