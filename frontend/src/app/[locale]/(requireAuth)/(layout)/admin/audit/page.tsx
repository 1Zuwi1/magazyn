import AuditMain from "@/components/admin-panel/audit/audit-page"
import ProtectedPage from "@/components/security/protected-page"

export default function AuditPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <AuditMain />
    </ProtectedPage>
  )
}
