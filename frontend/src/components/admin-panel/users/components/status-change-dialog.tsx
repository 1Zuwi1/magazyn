"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { AdminUser } from "@/hooks/use-admin-users"
import { useAppTranslations } from "@/i18n/use-translations"
import {
  getStatusLabel,
  getStatusVariant,
  normalizeValue,
} from "../lib/user-utils"

type AccountStatus = AdminUser["account_status"]

const STATUS_OPTIONS: AccountStatus[] = [
  "ACTIVE",
  "PENDING_VERIFICATION",
  "LOCKED",
  "DISABLED",
]

interface StatusChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | undefined
  onConfirm: (params: {
    userId: number
    status: AccountStatus
    reason?: string
  }) => void
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
}: StatusChangeDialogProps) {
  const t = useAppTranslations()

  const [selectedStatus, setSelectedStatus] = useState<AccountStatus | "">("")
  const [reason, setReason] = useState("")

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedStatus("")
      setReason("")
    }
    onOpenChange(isOpen)
  }

  const handleConfirm = () => {
    if (!(user && selectedStatus)) {
      return
    }
    onConfirm({
      userId: user.id,
      status: selectedStatus,
      reason: reason.trim() || undefined,
    })
    handleOpenChange(false)
  }

  const availableStatuses = STATUS_OPTIONS.filter(
    (status) => status !== user?.account_status
  )

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("generated.admin.users.changeAccountStatus")}
          </DialogTitle>
          <DialogDescription>
            {t("generated.admin.users.changeStatusUserAccount")}{" "}
            <strong>
              {normalizeValue(user?.full_name) || user?.email || ""}
            </strong>
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {user ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {t("generated.admin.users.currentStatus")}
              </span>
              <Badge variant={getStatusVariant(user.account_status)}>
                {getStatusLabel(user.account_status)}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-status">
                {t("generated.admin.users.newStatus")}
              </Label>
              <Select
                onValueChange={(value) =>
                  setSelectedStatus(value as AccountStatus)
                }
                value={selectedStatus}
              >
                <SelectTrigger className="w-full" id="new-status">
                  <SelectValue
                    placeholder={t("generated.admin.users.selectNewStatus")}
                    render={
                      <span>
                        {selectedStatus
                          ? getStatusLabel(selectedStatus)
                          : t("generated.admin.users.selectNewStatus")}
                      </span>
                    }
                  />
                </SelectTrigger>
                <SelectContent className="w-fit">
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-reason">
                {t("generated.admin.users.reasonOptional")}
              </Label>
              <Input
                id="status-reason"
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t(
                  "generated.admin.users.provideReasonChangingStatus"
                )}
                value={reason}
              />
            </div>
          </div>
        ) : null}
        <DialogFooter className="gap-1">
          <Button onClick={() => handleOpenChange(false)} variant="outline">
            {t("generated.shared.cancel")}
          </Button>
          <Button disabled={!selectedStatus} onClick={handleConfirm}>
            {t("generated.admin.shared.changeStatus")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
