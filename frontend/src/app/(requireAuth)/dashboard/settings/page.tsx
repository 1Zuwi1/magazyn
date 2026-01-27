import { SettingsContent } from "@/components/dashboard/settings/settings-content-old"
import ProtectedPage from "../../protected-page"

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
              status: session.status,
              twoFactorEnabled: session.two_factor_enabled,
            }}
          />
        )
      }}
    </ProtectedPage>
  )
}
