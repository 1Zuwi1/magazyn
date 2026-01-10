import { type NextRequest, NextResponse } from "next/server"
import { getUrl } from "@/lib/get-url"

export async function GET(req: NextRequest) {
  const url = await getUrl(req)
  return NextResponse.redirect(new URL("/dashboard/", url), 301)
}
