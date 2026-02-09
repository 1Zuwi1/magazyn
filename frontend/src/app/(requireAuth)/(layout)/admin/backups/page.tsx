import { BackupsMain } from "@/components/admin-panel/backups/backups-page"
import ProtectedPage from "@/components/security/protected-page"

export default function BackupsPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <BackupsMain />
    </ProtectedPage>
  )
}
