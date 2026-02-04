"use client"

import {
  Delete02Icon,
  Key02Icon,
  PencilEdit02Icon,
  SmartPhone01Icon,
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
  onRename: (passkey: Passkey) => void
  onDelete: (passkey: Passkey) => void
}

function PasskeyItem({ passkey, onRename, onDelete }: PasskeyItemProps) {
  return (
    <div className="group/item flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/50 p-3 transition-colors hover:border-border/80 hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
          <HugeiconsIcon
            className="text-primary"
            icon={SmartPhone01Icon}
            size={16}
          />
        </div>
        <div className="space-y-0.5">
          <p className="font-medium text-sm leading-none">{passkey.name}</p>
          <p className="text-muted-foreground text-xs">
            Klucz bezpieczeństwa #{passkey.id}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
        <Button
          onClick={() => onRename(passkey)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
          <span className="sr-only">Zmień nazwę</span>
        </Button>
        <Button
          onClick={() => onDelete(passkey)}
          size="icon-xs"
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

function PasskeysList({
  isLoading,
  passkeys,
  onRename,
  onDelete,
}: PasskeysListProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <div className="size-9 animate-pulse rounded-md bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (passkeys.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {passkeys.map((passkey) => (
        <PasskeyItem
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
        toast.success("Klucz bezpieczeństwa został usunięty.")
      },
    })
  }

  const isDisabled = supportState !== "supported" || isRegistering

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <HugeiconsIcon
                    className="text-primary"
                    icon={Key02Icon}
                    size={16}
                  />
                </div>
                Klucze bezpieczeństwa
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Dodaj klucz dostępu, aby logować się bez hasła.
              </p>
            </div>
            <Badge variant={SUPPORT_VARIANTS[supportState]}>
              {SUPPORT_LABELS[supportState]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Passkeys list */}
          <PasskeysList
            isLoading={isLoadingPasskeys}
            onDelete={handleOpenDelete}
            onRename={handleOpenRename}
            passkeys={passkeys}
          />

          {/* Add passkey section */}
          <div className="rounded-lg border border-border/60 border-dashed bg-muted/10 p-4">
            <div className="flex flex-col gap-3">
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  Dodaj nowy klucz bezpieczeństwa
                </p>
                <p className="text-muted-foreground text-xs">
                  Potwierdź biometrią, kluczem sprzętowym lub PIN-em.
                </p>
              </div>
              <Button
                disabled={isDisabled}
                isLoading={isRegistering}
                onClick={handleAddPasskey}
                type="button"
              >
                Dodaj klucz bezpieczeństwa
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nazwij swój klucz bezpieczeństwa</DialogTitle>
            <DialogDescription>
              Nadaj nazwę, która pomoże Ci rozpoznać to urządzenie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              autoFocus
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
            <p className="text-muted-foreground text-xs">
              Maksymalnie 50 znaków
            </p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Anuluj
            </DialogClose>
            <Button
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień nazwę klucza</DialogTitle>
            <DialogDescription>
              Wprowadź nową nazwę dla klucza bezpieczeństwa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              autoFocus
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
            <p className="text-muted-foreground text-xs">
              Maksymalnie 50 znaków
            </p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Anuluj
            </DialogClose>
            <Button
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
