import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function RackPage() {
  const cookieStore = await cookies()
  const rackIdCookie = cookieStore.get("rackId")?.value
  if (!rackIdCookie) {
    return redirect("/dashboard/")
  }
  return <div>Rack ID: {rackIdCookie}</div>
}
