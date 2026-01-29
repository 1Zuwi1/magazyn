import ProtectedPage from "@/app/(requireAuth)/protected-page"
import UsersMain from "@/components/admin-panel/users/users-page"

export default function UsersPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <UsersMain />
    </ProtectedPage>
  )
}
