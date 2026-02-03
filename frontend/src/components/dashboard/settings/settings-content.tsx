import { Settings01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProfileSection } from "./profile-section"
import { SecuritySection } from "./security-section"
import type { SettingsContentProps } from "./types"

export function SettingsContent({ user }: SettingsContentProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        description="Przeglądaj dane profilu i zarządzaj bezpieczeństwem konta."
        icon={Settings01Icon}
        title="Ustawienia konta"
      />

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
          <SecuritySection userEmail={user.email} />
        </section>
      </div>
    </div>
  )
}
