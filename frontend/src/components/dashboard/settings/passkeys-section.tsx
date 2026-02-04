"use client"

import {
  Delete02Icon,
  Key01Icon,
  PencilEdit02Icon,
  SecurityLockIcon,
  SmartPhone01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { handleApiError } from "@/components/dashboard/utils/helpers"
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
import useDeletePasskey from "@/hooks/use-delete-passkey"
import { LINKED_2FA_METHODS_QUERY_KEY } from "@/hooks/use-linked-methods"
import usePasskeys, { PASSKEYS_QUERY_KEY } from "@/hooks/use-passkeys"
import useRenamePasskey from "@/hooks/use-rename-passkey"
import { apiFetch, FetchError } from "@/lib/fetcher"
import {
  type Passkey,
  WebAuthnFinishRegistrationSchema,
  WebAuthnStartRegistrationSchema,
} from "@/lib/schemas"
import tryCatch from "@/lib/try-catch"
import {
  getWebAuthnErrorMessage,
  getWebAuthnSupport,
  isPublicKeyCredential,
  serializeCredential,
} from "@/lib/webauthn"
import { useTwoFactorVerificationDialog } from "./two-factor-verification-dialog-store"

const SUPPORT_LABELS = {
  checking: "Sprawdzanie",
  supported: "Obsługiwane",
  unsupported: "Brak wsparcia",
} as const

const SUPPORT_VARIANTS = {
  checking: "secondary",
  supported: "success",
  unsupported: "warning",
} as const

type SupportState = keyof typeof SUPPORT_LABELS

interface PasskeyItemProps {
  passkey: Passkey
  index: number
  onRename: (passkey: Passkey) => void
  onDelete: (passkey: Passkey) => void
}

function PasskeyItem({ passkey, index, onRename, onDelete }: PasskeyItemProps) {
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
            Klucz #{passkey.id} • Aktywny
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
          <span className="sr-only">Zmień nazwę</span>
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
          <span className="sr-only">Usuń</span>
        </Button>
      </div>
    </div>
  )
}

interface PasskeysListProps {
  isLoading: boolean
  passkeys: Passkey[]
  onRename: (passkey: Passkey) => void
  onDelete: (passkey: Passkey) => void
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
          <div className="size-11 animate-pulse rounded-xl bg-linear-to-br from-muted to-muted/50" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded-md bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  )
}

function PasskeysEmptyState() {
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
          Brak kluczy bezpieczeństwa
        </p>
        <p className="max-w-60 text-muted-foreground text-xs">
          Dodaj swój pierwszy klucz, aby logować się szybko i bezpiecznie bez
          hasła.
        </p>
      </div>
    </div>
  )
}

function PasskeysList({
  isLoading,
  passkeys,
  onRename,
  onDelete,
}: PasskeysListProps) {
  if (isLoading) {
    return <PasskeysListSkeleton />
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
  const [supportState, setSupportState] = useState<SupportState>("checking")
  const [isRegistering, setIsRegistering] = useState(false)
  const queryClient = useQueryClient()
  const { open } = useTwoFactorVerificationDialog()

  // Queries and mutations
  const { data: passkeys = [], isLoading: isLoadingPasskeys } = usePasskeys()
  const deletePasskey = useDeletePasskey()
  const renamePasskey = useRenamePasskey()

  // Naming dialog state
  const [isNamingDialogOpen, setIsNamingDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [pendingCredentialJson, setPendingCredentialJson] = useState<
    string | null
  >(null)
  const [isSavingName, setIsSavingName] = useState(false)

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

  const handleAddPasskey = async () => {
    if (supportState !== "supported") {
      toast.error("Twoje urządzenie nie obsługuje kluczy bezpieczeństwa.")
      return
    }

    if (!navigator.credentials) {
      toast.error("Twoja przeglądarka nie obsługuje WebAuthn.")
      return
    }

    setIsRegistering(true)

    try {
      const [startError, startResponse] = await tryCatch(
        apiFetch(
          "/api/webauthn/register/start",
          WebAuthnStartRegistrationSchema,
          {
            method: "POST",
            body: null,
          }
        )
      )

      if (startError) {
        if (
          startError instanceof FetchError &&
          startError.message === "INSUFFICIENT_PERMISSIONS"
        ) {
          open({
            onVerified: handleAddPasskey,
          })
          return
        }
        handleApiError(
          startError,
          "Nie udało się rozpocząć dodawania klucza bezpieczeństwa."
        )
        return
      }

      const [credentialError, credential] = await tryCatch(
        navigator.credentials.create({
          publicKey: startResponse,
        })
      )
      if (credentialError) {
        toast.error(
          getWebAuthnErrorMessage(
            credentialError,
            "Nie udało się utworzyć klucza bezpieczeństwa."
          )
        )
        return
      }

      if (!isPublicKeyCredential(credential)) {
        toast.error("Nie udało się odczytać danych klucza bezpieczeństwa.")
        return
      }

      const credentialJson = serializeCredential(credential)

      // Open naming dialog
      setPendingCredentialJson(credentialJson)
      setNewKeyName("")
      setIsNamingDialogOpen(true)
    } finally {
      setIsRegistering(false)
    }
  }

  const handleSaveNewPasskey = async () => {
    if (!(pendingCredentialJson && newKeyName.trim())) {
      return
    }

    setIsSavingName(true)

    const [finishError] = await tryCatch(
      apiFetch(
        "/api/webauthn/register/finish",
        WebAuthnFinishRegistrationSchema,
        {
          method: "POST",
          body: {
            credentialJson: pendingCredentialJson,
            keyName: newKeyName.trim(),
          },
        }
      )
    )

    setIsSavingName(false)

    if (finishError) {
      if (
        finishError instanceof FetchError &&
        finishError.code === "INSUFFICIENT_PERMISSIONS"
      ) {
        // Keep the dialog open, 2FA dialog will open
        return
      }
      handleApiError(
        finishError,
        "Nie udało się zakończyć dodawania klucza bezpieczeństwa."
      )
      return
    }

    setIsNamingDialogOpen(false)
    setPendingCredentialJson(null)
    setNewKeyName("")
    toast.success("Klucz bezpieczeństwa został dodany.")
    queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: LINKED_2FA_METHODS_QUERY_KEY })
  }

  const handleCancelNaming = () => {
    setIsNamingDialogOpen(false)
    setPendingCredentialJson(null)
    setNewKeyName("")
    toast.info("Dodawanie klucza zostało anulowane.")
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
          toast.success("Nazwa klucza została zmieniona.")
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
        toast.success("Klucz bezpieczeństwa został usunięty.")
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
                  Klucze bezpieczeństwa
                </CardTitle>
                <p className="max-w-70 text-muted-foreground text-sm leading-relaxed">
                  Loguj się szybciej i bezpieczniej bez hasła.
                </p>
              </div>
            </div>
            <Badge className="mt-1" variant={SUPPORT_VARIANTS[supportState]}>
              {SUPPORT_LABELS[supportState]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Passkeys list */}
          <PasskeysList
            isLoading={isLoadingPasskeys}
            onDelete={handleOpenDelete}
            onRename={handleOpenRename}
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
                    Dodaj nowy klucz
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Biometria, klucz sprzętowy lub PIN
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
                Dodaj klucz
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
              Nazwij swój klucz bezpieczeństwa
            </DialogTitle>
            <DialogDescription className="text-center">
              Nadaj nazwę, która pomoże Ci rozpoznać to urządzenie.
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
              placeholder="np. MacBook Pro, iPhone 15"
              value={newKeyName}
            />
            <p className="text-center text-muted-foreground/70 text-xs">
              Maksymalnie 50 znaków
            </p>
          </div>
          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <DialogClose
              render={<Button className="flex-1" variant="outline" />}
            >
              Anuluj
            </DialogClose>
            <Button
              className="flex-1"
              disabled={!newKeyName.trim() || isSavingName}
              isLoading={isSavingName}
              onClick={handleSaveNewPasskey}
            >
              Zapisz klucz
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
              Zmień nazwę klucza
            </DialogTitle>
            <DialogDescription className="text-center">
              Wprowadź nową nazwę dla klucza bezpieczeństwa.
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
              placeholder="np. MacBook Pro, iPhone 15"
              value={renameValue}
            />
            <p className="text-center text-muted-foreground/70 text-xs">
              Maksymalnie 50 znaków
            </p>
          </div>
          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <DialogClose
              render={<Button className="flex-1" variant="outline" />}
            >
              Anuluj
            </DialogClose>
            <Button
              className="flex-1"
              disabled={!renameValue.trim()}
              isLoading={renamePasskey.isPending}
              onClick={handleRename}
            >
              Zapisz zmiany
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
            <AlertDialogTitle>Usuń klucz bezpieczeństwa?</AlertDialogTitle>
            <AlertDialogDescription>
              Klucz &ldquo;{deletingPasskey?.name}&rdquo; zostanie trwale
              usunięty. Nie będzie można go użyć do logowania.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              isLoading={deletePasskey.isPending}
              onClick={handleDelete}
              variant="destructive"
            >
              Usuń klucz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
