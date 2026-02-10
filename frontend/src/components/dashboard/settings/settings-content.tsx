import { Settings01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { PageHeader } from "@/components/dashboard/page-header"
import { useAppTranslations } from "@/i18n/use-translations"
import { LogoutSection } from "./logout-section"
import { ProfileSection } from "./profile-section"
import { SecuritySection } from "./security-section"
import type { SettingsContentProps } from "./types"
export function SettingsContent({ user }: SettingsContentProps) {
  const t = useAppTranslations()

  return (
    <div className="space-y-8">
      <PageHeader
        description={t(
          "generated.dashboard.settings.viewProfileDetailsManageAccount"
        )}
        icon={Settings01Icon}
        title={t("generated.dashboard.settings.accountSettings")}
      />

      <div className="grid gap-8 2xl:grid-cols-5">
        <section className="space-y-6 2xl:col-span-3">
          <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            <HugeiconsIcon icon={UserIcon} size={14} />
            <span>{t("generated.dashboard.settings.profileData")}</span>
          </div>
          <ProfileSection user={user} />
        </section>

        <section className="space-y-6 2xl:col-span-2">
          <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            <HugeiconsIcon icon={Settings01Icon} size={14} />
            <span>{t("generated.dashboard.settings.security")}</span>
          </div>
          <SecuritySection userEmail={user.email} />
          <LogoutSection />
        </section>
      </div>
    </div>
  )
}
