import { Settings01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { ProfileSection } from "./profile-section"
import { SecuritySection } from "./security-section"
import type { SettingsContentProps } from "./types"

export function SettingsContent({ user }: SettingsContentProps) {
  return (
    <div className="space-y-8">
      <header className="relative">
        <div className="relative flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
            <HugeiconsIcon
              className="text-primary"
              icon={Settings01Icon}
              size={24}
            />
          </div>
          <div className="space-y-1">
            <h1 className="font-semibold text-2xl tracking-tight">
              Ustawienia konta
            </h1>
            <p className="text-muted-foreground text-sm">
              Przeglądaj dane profilu i zarządzaj bezpieczeństwem konta.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 xl:grid-cols-5">
        <section className="space-y-6 xl:col-span-3">
          <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            <HugeiconsIcon icon={UserIcon} size={14} />
            <span>Dane profilu</span>
          </div>
          <ProfileSection user={user} />
        </section>

        <section className="space-y-6 xl:col-span-2">
          <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            <HugeiconsIcon icon={Settings01Icon} size={14} />
            <span>Bezpieczeństwo</span>
          </div>
          <SecuritySection
            initialTwoFactorEnabled={user.twoFactorEnabled}
            userEmail={user.email}
          />
        </section>
      </div>
    </div>
  )
}
