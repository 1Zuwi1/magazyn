import ProtectedPage from "@/components/security/protected-page"
import AssortmentClient from "./assortment-client"

export default async function AssortmentPage() {
  return (
    <ProtectedPage>
      <AssortmentClient />
    </ProtectedPage>
  )
}
