import { ApiKeysMain } from "@/components/admin-panel/api-keys/api-keys-page"
import ProtectedPage from "@/components/security/protected-page"

export default function ApiKeysPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <ApiKeysMain />
    </ProtectedPage>
  )
}
