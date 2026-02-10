import ProtectedPage from "@/components/security/protected-page"
import ItemsClientPage from "./items-client"

export default function ItemsPage() {
  return (
    <ProtectedPage>
      <ItemsClientPage />
    </ProtectedPage>
  )
}
