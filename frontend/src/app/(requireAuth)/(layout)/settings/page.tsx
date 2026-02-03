import { SettingsContent } from "@/components/dashboard/settings/settings-content"
import ProtectedPage from "@/components/security/protected-page"

export default function SettingsPage() {
  return (
    <ProtectedPage>
      {(session) => {
        return (
          <SettingsContent
            user={{
              email: session.email,
              fullName: session.full_name,
              id: session.id,
              role: session.role,
              status: session.account_status,
            }}
          />
        )
      }}
    </ProtectedPage>
  )
}
