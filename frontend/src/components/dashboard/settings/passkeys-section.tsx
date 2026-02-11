"use client"

import {
  Alert02Icon,
  Delete02Icon,
  Key01Icon,
  PencilEdit02Icon,
  SecurityLockIcon,
  SmartPhone01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { usePasskeyRegistration } from "@/hooks/use-2fa"
import useDeletePasskey from "@/hooks/use-delete-passkey"
import { LINKED_2FA_METHODS_QUERY_KEY } from "@/hooks/use-linked-methods"
import usePasskeys, { PASSKEYS_QUERY_KEY } from "@/hooks/use-passkeys"
import useRenamePasskey from "@/hooks/use-rename-passkey"
import type { Passkey } from "@/lib/schemas"
import { getWebAuthnSupport } from "@/lib/webauthn"

type SupportState = "checking" | "supported" | "unsupported"

const SUPPORT_LABEL_KEYS: Record<SupportState, string> = {
  checking: "passkeys.support.checking",
  supported: "generated.dashboard.settings.supported",
  unsupported: "passkeys.support.unsupported",
}

const SUPPORT_VARIANTS = {
  checking: "secondary",
  supported: "success",
  unsupported: "warning",
} as const

interface PasskeyItemProps {
  passkey: Passkey
  index: number
  onRename: (passkey: Passkey) => void
  onDelete: (passkey: Passkey) => void
}

function PasskeyItem({ passkey, index, onRename, onDelete }: PasskeyItemProps) {
  const t = useTranslations()

  return (
    <div
      className="group/item relative flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-linear-to-r from-background to-muted/20 p-4 shadow-xs transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Subtle gradient line on the left */}
      <div className="absolute top-3 bottom-3 left-0 w-0.5 rounded-full bg-linear-to-b from-primary/60 via-primary/30 to-transparent opacity-0 transition-opacity duration-300 group-hover/item:opacity-100" />

      <div className="flex items-center gap-4">
        {/* Icon container with layered effect */}
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md transition-all duration-300 group-hover/item:bg-primary/30 group-hover/item:blur-lg" />
          <div className="relative flex size-11 items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20 transition-all duration-300 group-hover/item:ring-primary/40">
            <HugeiconsIcon
              className="text-primary transition-transform duration-300 group-hover/item:scale-110"
              icon={SmartPhone01Icon}
              size={18}
            />
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm leading-none tracking-tight">
              {passkey.name}
            </p>
            <div className="flex size-4 items-center justify-center rounded-full bg-green-500/15">
              <HugeiconsIcon
                className="text-green-600 dark:text-green-500"
                icon={Tick01Icon}
                size={10}
              />
            </div>
          </div>
          <p className="text-muted-foreground/70 text-xs">
            {t("generated.dashboard.settings.keyActive", {
              value0: passkey.id,
            })}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 opacity-0 transition-all duration-200 group-hover/item:opacity-100">
        <Button
          className="size-8 rounded-lg bg-muted/50 hover:bg-muted"
          onClick={() => onRename(passkey)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <HugeiconsIcon
            className="text-muted-foreground"
            icon={PencilEdit02Icon}
            size={14}
          />
          <span className="sr-only">
            {t("generated.dashboard.settings.changeName")}
          </span>
        </Button>
        <Button
          className="size-8 rounded-lg bg-destructive/5 hover:bg-destructive/10"
          onClick={() => onDelete(passkey)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <HugeiconsIcon
            className="text-destructive"
            icon={Delete02Icon}
            size={14}
          />
          <span className="sr-only">{t("generated.shared.remove")}</span>
        </Button>
      </div>
    </div>
  )
}

interface PasskeysListProps {
  isLoading: boolean
  isError?: boolean
  passkeys: Passkey[]
  onRename: (passkey: Passkey) => void
  onDelete: (passkey: Passkey) => void
  onRetry?: () => void
}

function PasskeysListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div
          className="flex items-center gap-4 rounded-xl border border-border/30 bg-muted/10 p-4"
          key={i}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <Skeleton className="size-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

function PasskeysEmptyState() {
  const t = useTranslations()

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 border-dashed bg-linear-to-b from-muted/30 to-transparent px-6 py-8 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20">
          <HugeiconsIcon
            className="text-primary/70"
            icon={SecurityLockIcon}
            size={24}
          />
        </div>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground/80 text-sm">
          {t("generated.dashboard.settings.securityKeys2")}
        </p>
        <p className="max-w-60 text-muted-foreground text-xs">
          {t("generated.dashboard.settings.addFirstKeyLogQuickly")}
        </p>
      </div>
    </div>
  )
}

function PasskeysList({
  isLoading,
  isError,
  passkeys,
  onRename,
  onDelete,
  onRetry,
}: PasskeysListProps) {
  const t = useTranslations()

  if (isLoading) {
    return <PasskeysListSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/20 border-dashed bg-destructive/5 px-6 py-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
          <HugeiconsIcon
            className="text-destructive"
            icon={Alert02Icon}
            size={20}
          />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground/80 text-sm">
            {t("generated.dashboard.settings.failedLoadKeys")}
          </p>
          <p className="text-muted-foreground text-xs">
            {t("generated.dashboard.settings.problemDownloadingData")}
          </p>
        </div>
        {onRetry && (
          <button
            className="rounded-md border px-3 py-1.5 font-medium text-xs transition-colors hover:bg-muted"
            onClick={onRetry}
            type="button"
          >
            {t("generated.shared.again")}
          </button>
        )}
      </div>
    )
  }

  if (passkeys.length === 0) {
    return <PasskeysEmptyState />
  }

  return (
    <div className="space-y-3">
      {passkeys.map((passkey, index) => (
        <PasskeyItem
          index={index}
          key={passkey.id}
          onDelete={onDelete}
          onRename={onRename}
          passkey={passkey}
        />
      ))}
    </div>
  )
}

export function PasskeysSection() {
  const t = useTranslations()

  const [supportState, setSupportState] = useState<SupportState>("checking")
  const queryClient = useQueryClient()

  // Queries and mutations
  const {
    data: passkeys = [],
    isLoading: isLoadingPasskeys,
    isError: isPasskeysError,
    refetch: refetchPasskeys,
  } = usePasskeys()
  const deletePasskey = useDeletePasskey()
  const renamePasskey = useRenamePasskey()

  // Naming dialog state
  const [isNamingDialogOpen, setIsNamingDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [pendingCredentialJson, setPendingCredentialJson] = useState<
    string | null
  >(null)
  const {
    handleAddPasskey,
    handleSaveNewPasskey,
    isRegistering,
    isSavingName,
  } = usePasskeyRegistration({
    isSupported: supportState === "supported",
    newKeyName,
    pendingCredentialJson,
    setIsNamingDialogOpen,
    setNewKeyName,
    setPendingCredentialJson,
    onSaveSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: LINKED_2FA_METHODS_QUERY_KEY })
    },
  })

  // Rename dialog state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renamingPasskey, setRenamingPasskey] = useState<Passkey | null>(null)
  const [renameValue, setRenameValue] = useState("")

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingPasskey, setDeletingPasskey] = useState<Passkey | null>(null)

  useEffect(() => {
    setSupportState(getWebAuthnSupport())
  }, [])

  const handleCancelNaming = () => {
    setIsNamingDialogOpen(false)
    setPendingCredentialJson(null)
    setNewKeyName("")
    toast.info(t("generated.dashboard.settings.addingKeyBeenCanceled"))
  }

  const handleOpenRename = (passkey: Passkey) => {
    setRenamingPasskey(passkey)
    setRenameValue(passkey.name)
    setIsRenameDialogOpen(true)
  }

  const handleRename = () => {
    if (!(renamingPasskey && renameValue.trim())) {
      return
    }

    renamePasskey.mutate(
      { id: renamingPasskey.id, name: renameValue.trim() },
      {
        onSuccess: () => {
          setIsRenameDialogOpen(false)
          setRenamingPasskey(null)
          setRenameValue("")
          toast.success(t("generated.dashboard.settings.keyNameBeenChanged"))
        },
      }
    )
  }

  const handleOpenDelete = (passkey: Passkey) => {
    setDeletingPasskey(passkey)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (!deletingPasskey) {
      return
    }

    deletePasskey.mutate(deletingPasskey.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setDeletingPasskey(null)
        queryClient.invalidateQueries({
          queryKey: LINKED_2FA_METHODS_QUERY_KEY,
        })
        toast.success(t("generated.dashboard.settings.securityKeyBeenDeleted"))
      },
    })
  }

  const isDisabled = supportState !== "supported" || isRegistering

  return (
    <>
      <Card className="relative overflow-hidden">
        {/* Decorative gradient accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Enhanced icon with glow effect */}
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg" />
                <div className="relative flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 via-primary/10 to-primary/5 ring-1 ring-primary/20">
                  <HugeiconsIcon
                    className="text-primary"
                    icon={Key01Icon}
                    size={22}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-lg tracking-tight">
                  {t("generated.dashboard.settings.securityKeys")}
                </CardTitle>
                <p className="max-w-70 text-muted-foreground text-sm leading-relaxed">
                  {t(
                    "generated.dashboard.settings.logFasterMoreSecurelyWithout"
                  )}
                </p>
              </div>
            </div>
            <Badge className="mt-1" variant={SUPPORT_VARIANTS[supportState]}>
              {t(SUPPORT_LABEL_KEYS[supportState])}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Passkeys list */}
          <PasskeysList
            isError={isPasskeysError}
            isLoading={isLoadingPasskeys}
            onDelete={handleOpenDelete}
            onRename={handleOpenRename}
            onRetry={() => refetchPasskeys()}
            passkeys={passkeys}
          />

          {/* Add passkey section - redesigned */}
          <div className="group/add relative overflow-hidden rounded-xl border border-primary/30 border-dashed bg-linear-to-br from-primary/5 via-transparent to-transparent p-5 transition-all duration-300 hover:border-primary/50 hover:from-primary/10">
            {/* Decorative corner accent */}
            <div className="absolute -top-12 -right-12 size-24 rounded-full bg-primary/10 blur-2xl transition-all duration-500 group-hover/add:bg-primary/20" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <HugeiconsIcon
                    className="text-primary"
                    icon={Key01Icon}
                    size={18}
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-sm tracking-tight">
                    {t("generated.dashboard.settings.addNewKey")}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t("generated.dashboard.settings.biometricsDonglePin")}
                  </p>
                </div>
              </div>
              <Button
                className="w-full sm:w-auto"
                disabled={isDisabled}
                isLoading={isRegistering}
                onClick={handleAddPasskey}
                type="button"
              >
                <HugeiconsIcon icon={Key01Icon} size={16} />
                {t("generated.dashboard.settings.addKey")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Naming dialog for new passkey */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            handleCancelNaming()
          }
        }}
        open={isNamingDialogOpen}
      >
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            {/* Decorative icon header */}
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20">
              <HugeiconsIcon
                className="text-primary"
                icon={Key01Icon}
                size={24}
              />
            </div>
            <DialogTitle className="text-center">
              {t("generated.dashboard.settings.nameSecurityKey")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("generated.dashboard.settings.giveNameWillHelpRecognize")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              autoFocus
              className="h-11"
              maxLength={50}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newKeyName.trim()) {
                  handleSaveNewPasskey()
                }
              }}
              placeholder={t("generated.dashboard.settings.eGMacbookProIphone")}
              value={newKeyName}
            />
            <p className="text-center text-muted-foreground/70 text-xs">
              {t("generated.dashboard.settings.maximum50Characters")}
            </p>
          </div>
          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <DialogClose
              render={<Button className="flex-1" variant="outline" />}
            >
              {t("generated.shared.cancel")}
            </DialogClose>
            <Button
              className="flex-1"
              disabled={!newKeyName.trim() || isSavingName}
              isLoading={isSavingName}
              onClick={handleSaveNewPasskey}
            >
              {t("generated.dashboard.settings.saveKey")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setIsRenameDialogOpen(false)
            setRenamingPasskey(null)
            setRenameValue("")
          }
        }}
        open={isRenameDialogOpen}
      >
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            {/* Decorative icon header */}
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-muted via-muted/50 to-transparent ring-1 ring-border">
              <HugeiconsIcon
                className="text-foreground/70"
                icon={PencilEdit02Icon}
                size={24}
              />
            </div>
            <DialogTitle className="text-center">
              {t("generated.dashboard.settings.renameKey")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("generated.dashboard.settings.enterNewNameSecurityKey")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              autoFocus
              className="h-11"
              maxLength={50}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameValue.trim()) {
                  handleRename()
                }
              }}
              placeholder={t("generated.dashboard.settings.eGMacbookProIphone")}
              value={renameValue}
            />
            <p className="text-center text-muted-foreground/70 text-xs">
              {t("generated.dashboard.settings.maximum50Characters")}
            </p>
          </div>
          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <DialogClose
              render={<Button className="flex-1" variant="outline" />}
            >
              {t("generated.shared.cancel")}
            </DialogClose>
            <Button
              className="flex-1"
              disabled={!renameValue.trim()}
              isLoading={renamePasskey.isPending}
              onClick={handleRename}
            >
              {t("generated.dashboard.settings.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteDialogOpen(false)
            setDeletingPasskey(null)
          }
        }}
        open={isDeleteDialogOpen}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <HugeiconsIcon
                className="text-destructive"
                icon={Delete02Icon}
                size={24}
              />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {t("generated.dashboard.settings.deleteSecurityKey")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("generated.dashboard.settings.keyWillPermanentlyDeletedWont", {
                value0: deletingPasskey?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("generated.shared.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              isLoading={deletePasskey.isPending}
              onClick={handleDelete}
              variant="destructive"
            >
              {t("generated.dashboard.settings.deleteKey")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
