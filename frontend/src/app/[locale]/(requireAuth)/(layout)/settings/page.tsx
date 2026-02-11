import { SettingsContent } from "@/components/dashboard/settings/settings-content"
import ProtectedPage from "@/components/security/protected-page"

export default function SettingsPage() {
  return (
    <ProtectedPage>
      {(session) => <SettingsContent user={session} />}
    </ProtectedPage>
  )
}
