import { Settings01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { PageHeader } from "@/components/dashboard/page-header"
import { translateMessage } from "@/i18n/translate-message"
import { LogoutSection } from "./logout-section"
import { ProfileSection } from "./profile-section"
import { SecuritySection } from "./security-section"
import type { SettingsContentProps } from "./types"

export function SettingsContent({ user }: SettingsContentProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        description={translateMessage("generated.m0584")}
        icon={Settings01Icon}
        title={translateMessage("generated.m0585")}
      />

      <div className="grid gap-8 2xl:grid-cols-5">
        <section className="space-y-6 2xl:col-span-3">
          <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            <HugeiconsIcon icon={UserIcon} size={14} />
            <span>{translateMessage("generated.m0586")}</span>
          </div>
          <ProfileSection user={user} />
        </section>

        <section className="space-y-6 2xl:col-span-2">
          <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            <HugeiconsIcon icon={Settings01Icon} size={14} />
            <span>{translateMessage("generated.m0587")}</span>
          </div>
          <SecuritySection userEmail={user.email} />
          <LogoutSection />
        </section>
      </div>
    </div>
  )
}
