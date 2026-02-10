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
import { translateMessage } from "@/i18n/translate-message"
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
          <DialogTitle>{translateMessage("generated.m0274")}</DialogTitle>
          <DialogDescription>
            {translateMessage("generated.m0275")}{" "}
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
                {translateMessage("generated.m0276")}
              </span>
              <Badge variant={getStatusVariant(user.account_status)}>
                {getStatusLabel(user.account_status)}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-status">
                {translateMessage("generated.m0277")}
              </Label>
              <Select
                onValueChange={(value) =>
                  setSelectedStatus(value as AccountStatus)
                }
                value={selectedStatus}
              >
                <SelectTrigger className="w-full" id="new-status">
                  <SelectValue
                    placeholder={translateMessage("generated.m0278")}
                    render={
                      <span>
                        {selectedStatus
                          ? getStatusLabel(selectedStatus)
                          : translateMessage("generated.m0278")}
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
                {translateMessage("generated.m0279")}
              </Label>
              <Input
                id="status-reason"
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder={translateMessage("generated.m0280")}
                value={reason}
              />
            </div>
          </div>
        ) : null}
        <DialogFooter className="gap-1">
          <Button onClick={() => handleOpenChange(false)} variant="outline">
            {translateMessage("generated.m0885")}
          </Button>
          <Button disabled={!selectedStatus} onClick={handleConfirm}>
            {translateMessage("generated.m0176")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
