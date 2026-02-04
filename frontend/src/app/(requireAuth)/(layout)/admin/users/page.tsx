import UsersMain from "@/components/admin-panel/users/users-page"
import ProtectedPage from "@/components/security/protected-page"

export default function UsersPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <UsersMain />
    </ProtectedPage>
  )
}
