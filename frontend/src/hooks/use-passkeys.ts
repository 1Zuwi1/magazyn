import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/fetcher"
import { PasskeysSchema } from "@/lib/schemas"

export default function usePasskeys() {
  return useQuery({
    queryKey: ["passkeys-available"],
    queryFn: async () => apiFetch("/api/webauthn/credentials", PasskeysSchema),
  })
}
