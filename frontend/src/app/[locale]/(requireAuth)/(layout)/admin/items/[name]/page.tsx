import ProtectedPage from "@/components/security/protected-page"
import ItemClient from "./item-client"

export default async function AdminItemDetailPage() {
  return (
    <ProtectedPage needAdminPrivileges>
      <ItemClient />
    </ProtectedPage>
  )
}
