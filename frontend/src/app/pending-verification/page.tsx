import { Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { translateMessage } from "@/i18n/translate-message"

export default function PendingVerificationPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center">
            <HugeiconsIcon
              className="size-16 text-amber-500"
              icon={Clock01Icon}
            />
          </div>
          <CardTitle className="mt-4 text-2xl">
            {translateMessage(
              "generated.auth.pendingVerification.waitingVerification"
            )}
          </CardTitle>
          <CardDescription>
            {translateMessage(
              "generated.auth.pendingVerification.accountWaitingApprovalAdministrator"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {translateMessage(
              "generated.auth.pendingVerification.registrationBeenAcceptedWaitingVerification"
            )}
          </p>
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm">
              <span className="font-semibold">
                {translateMessage("generated.auth.pendingVerification.now")}
              </span>
            </p>
            <ul className="mt-2 list-inside list-disc text-left text-muted-foreground text-sm">
              <li>
                {translateMessage(
                  "generated.auth.pendingVerification.waitConfirmationEmail"
                )}
              </li>
              <li>
                {translateMessage(
                  "generated.auth.pendingVerification.checkInboxRegularly"
                )}
              </li>
              <li>
                {translateMessage(
                  "generated.auth.pendingVerification.contactAdministratorTakesLonger24"
                )}
              </li>
            </ul>
          </div>
          <Link href="/login">
            <Button className="w-full" variant="outline">
              {translateMessage(
                "generated.auth.pendingVerification.returnLoginPage"
              )}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
