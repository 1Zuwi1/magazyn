"use client"

import {
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
  EyeIcon,
  Key01Icon,
  RefreshIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "next-intl"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { formatDateTime } from "@/components/dashboard/utils/helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState, ErrorEmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useApiKeys, {
  type ApiKey,
  type CreateApiKeyInput,
  useApiKey,
  useCreateApiKey,
  useDeleteApiKey,
} from "@/hooks/use-api-keys"
import { useAppTranslations } from "@/i18n/use-translations"
import { WarehouseSelector } from "../backups/components/warehouse-selector"
import { AdminPageHeader } from "../components/admin-page-header"
import { ConfirmDialog } from "../components/dialogs"

const API_KEY_SCOPES = [
  "SENSOR_WRITE",
  "REPORTS_GENERATE",
  "INVENTORY_READ",
  "STRUCTURE_READ",
] as const

type ApiKeyScope = (typeof API_KEY_SCOPES)[number]

interface CreatedApiKeyPreview {
  id: number
  rawKey: string
  keyPrefix: string
  name: string
  warehouseName: string | null | undefined
  scopes: string[]
  createdAt: string
}

const getScopeFallbackLabel = (scope: string): string => {
  return scope
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1)}${part.slice(1).toLowerCase()}`)
    .join(" ")
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="relative overflow-hidden border-border/70 bg-linear-to-br from-amber-500/[0.08] via-card to-card p-4">
      <div className="pointer-events-none absolute -top-6 -right-10 size-24 rounded-full bg-amber-500/10 blur-2xl" />
      <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-2 font-semibold text-2xl tracking-tight">{value}</p>
    </Card>
  )
}

function ScopeBadges({ scopes }: { scopes: readonly string[] }) {
  const t = useAppTranslations()

  const getScopeLabel = (scope: string) => {
    const translationKey = `generated.admin.apiKeys.scopes.${scope}`
    if (t.has(translationKey)) {
      return t(translationKey)
    }
    return getScopeFallbackLabel(scope)
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {scopes.map((scope) => (
        <Badge className="font-mono text-[10px]" key={scope} variant="outline">
          {getScopeLabel(scope)}
        </Badge>
      ))}
    </div>
  )
}

function ApiKeysLoadingState() {
  return (
    <Card className="p-0">
      <div className="space-y-4 p-5">
        <Skeleton className="h-5 w-56" />
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              className="h-10 w-full"
              key={`api-keys-skeleton-${index}`}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

function ApiKeysTable({
  apiKeys,
  onDelete,
  onView,
}: {
  apiKeys: ApiKey[]
  onDelete: (apiKeyId: number) => void
  onView: (apiKeyId: number) => void
}) {
  const t = useAppTranslations()
  const locale = useLocale()

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("generated.shared.name")}</TableHead>
              <TableHead>{t("generated.admin.apiKeys.key")}</TableHead>
              <TableHead>{t("generated.shared.warehouse")}</TableHead>
              <TableHead>{t("generated.admin.apiKeys.scopesLabel")}</TableHead>
              <TableHead>{t("generated.shared.status")}</TableHead>
              <TableHead>{t("generated.shared.created")}</TableHead>
              <TableHead>{t("generated.admin.apiKeys.lastUsed")}</TableHead>
              <TableHead className="text-right">
                {t("generated.admin.apiKeys.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium">{apiKey.name}</p>
                    <p className="font-mono text-muted-foreground text-xs">
                      #{apiKey.id}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">
                    {apiKey.keyPrefix}
                    {Array.from(
                      { length: 16 - apiKey.keyPrefix.length },
                      () => "*"
                    ).join("")}
                  </span>
                </TableCell>
                <TableCell>
                  {apiKey.warehouseName ??
                    t("generated.admin.apiKeys.allWarehouses")}
                </TableCell>
                <TableCell className="max-w-[16rem]">
                  <ScopeBadges scopes={apiKey.scopes} />
                </TableCell>
                <TableCell>
                  <Badge variant={apiKey.active ? "success" : "secondary"}>
                    {apiKey.active
                      ? t("generated.shared.active")
                      : t("generated.shared.disabled")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDateTime(apiKey.createdAt, locale)}
                </TableCell>
                <TableCell>
                  {apiKey.lastUsedAt
                    ? formatDateTime(apiKey.lastUsedAt, locale)
                    : t("generated.admin.apiKeys.neverUsed")}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      aria-label={t("generated.admin.apiKeys.openDetails")}
                      onClick={() => {
                        onView(apiKey.id)
                      }}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <HugeiconsIcon className="size-4" icon={EyeIcon} />
                    </Button>
                    <Button
                      aria-label={t("generated.admin.apiKeys.deleteKey")}
                      onClick={() => {
                        onDelete(apiKey.id)
                      }}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

function ApiKeyDetailsDialog({
  apiKeyId,
  onOpenChange,
}: {
  apiKeyId: number | null
  onOpenChange: (open: boolean) => void
}) {
  const t = useAppTranslations()
  const locale = useLocale()

  const {
    data: apiKey,
    isPending,
    isError,
    refetch,
  } = useApiKey(
    {
      apiKeyId: apiKeyId ?? -1,
    },
    {
      enabled: apiKeyId != null,
    }
  )

  return (
    <Dialog onOpenChange={onOpenChange} open={apiKeyId != null}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("generated.admin.apiKeys.detailsTitle")}</DialogTitle>
          <DialogDescription>
            {t("generated.admin.apiKeys.detailsDescription")}
          </DialogDescription>
        </DialogHeader>

        {isPending && (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton
                className="h-11 w-full"
                key={`details-skeleton-${index}`}
              />
            ))}
          </div>
        )}

        {isError && !isPending && (
          <ErrorEmptyState
            onRetry={async () => {
              await refetch()
            }}
          />
        )}

        {apiKey && !isPending && !isError && (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.shared.name")}
                </p>
                <p className="font-medium">{apiKey.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.admin.apiKeys.key")}
                </p>
                <p className="font-mono text-xs">
                  {apiKey.keyPrefix}
                  {Array.from(
                    { length: 16 - apiKey.keyPrefix.length },
                    () => "*"
                  ).join("")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.shared.warehouse")}
                </p>
                <p>
                  {apiKey.warehouseName ??
                    t("generated.admin.apiKeys.allWarehouses")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.shared.status")}
                </p>
                <Badge variant={apiKey.active ? "success" : "secondary"}>
                  {apiKey.active
                    ? t("generated.shared.active")
                    : t("generated.shared.disabled")}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.shared.created")}
                </p>
                <p>{formatDateTime(apiKey.createdAt, locale)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.admin.apiKeys.lastUsed")}
                </p>
                <p>
                  {apiKey.lastUsedAt
                    ? formatDateTime(apiKey.lastUsedAt, locale)
                    : t("generated.admin.apiKeys.neverUsed")}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.admin.apiKeys.createdBy")}
                </p>
                <p className="font-mono text-xs">#{apiKey.createdByUserId}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">
                {t("generated.admin.apiKeys.scopesLabel")}
              </p>
              <ScopeBadges scopes={apiKey.scopes} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function NewApiKeyDialog({
  createdApiKey,
  copied,
  onClose,
  onCopy,
}: {
  createdApiKey: CreatedApiKeyPreview | null
  copied: boolean
  onClose: () => void
  onCopy: () => void
}) {
  const t = useAppTranslations()
  const locale = useLocale()

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      open={createdApiKey != null}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("generated.admin.apiKeys.newKeyTitle")}</DialogTitle>
          <DialogDescription>
            {t("generated.admin.apiKeys.newKeyDescription")}
          </DialogDescription>
        </DialogHeader>

        {createdApiKey && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="font-medium text-amber-700 text-sm dark:text-amber-300">
                {t("generated.admin.apiKeys.oneTimeWarning")}
              </p>
              <p className="mt-1 text-amber-700/90 text-xs dark:text-amber-300/90">
                {t("generated.admin.apiKeys.storeInSafePlace")}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="mb-2 font-medium text-sm">
                {t("generated.admin.apiKeys.rawKey")}
              </p>
              <p className="select-all break-all rounded-md border bg-background px-3 py-2 font-mono text-xs">
                {createdApiKey.rawKey}
              </p>
              <Button
                className="mt-3"
                onClick={onCopy}
                size="sm"
                variant="outline"
              >
                <HugeiconsIcon
                  className="mr-1.5 size-4"
                  icon={copied ? Tick02Icon : Copy01Icon}
                />
                {copied
                  ? t("generated.admin.apiKeys.copied")
                  : t("generated.admin.apiKeys.copyRawKey")}
              </Button>
            </div>

            <Separator />

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.shared.name")}
                </p>
                <p className="font-medium">{createdApiKey.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.admin.apiKeys.prefix")}
                </p>
                <p className="font-mono text-xs">{createdApiKey.keyPrefix}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.shared.warehouse")}
                </p>
                <p>
                  {createdApiKey.warehouseName ??
                    t("generated.admin.apiKeys.allWarehouses")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.shared.created")}
                </p>
                <p>{formatDateTime(createdApiKey.createdAt, locale)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {t("generated.admin.apiKeys.scopesLabel")}
                </p>
                <ScopeBadges scopes={createdApiKey.scopes} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>{t("generated.shared.close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ApiKeysMain() {
  const t = useAppTranslations()

  const {
    data: apiKeysData,
    isPending: isApiKeysPending,
    isError: isApiKeysError,
    isRefetching,
    refetch: refetchApiKeys,
  } = useApiKeys()

  const createApiKeyMutation = useCreateApiKey()
  const deleteApiKeyMutation = useDeleteApiKey()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [apiKeyToDeleteId, setApiKeyToDeleteId] = useState<number | null>(null)
  const [detailsApiKeyId, setDetailsApiKeyId] = useState<number | null>(null)
  const [createdApiKey, setCreatedApiKey] =
    useState<CreatedApiKeyPreview | null>(null)
  const [copiedRawKey, setCopiedRawKey] = useState(false)

  const [name, setName] = useState("")
  const [warehouseId, setWarehouseId] = useState<number | null>(null)
  const [selectedScopes, setSelectedScopes] = useState<
    CreateApiKeyInput["scopes"]
  >(["INVENTORY_READ"])

  const apiKeys = useMemo(() => apiKeysData ?? [], [apiKeysData])
  const hasLoadedApiKeys = !(isApiKeysPending || isApiKeysError)

  const activeKeysCount = useMemo(
    () => apiKeys.filter((apiKey) => apiKey.active).length,
    [apiKeys]
  )
  const neverUsedKeysCount = useMemo(
    () => apiKeys.filter((apiKey) => apiKey.lastUsedAt == null).length,
    [apiKeys]
  )

  const apiKeyToDelete = useMemo(
    () => apiKeys.find((apiKey) => apiKey.id === apiKeyToDeleteId),
    [apiKeys, apiKeyToDeleteId]
  )

  const resetCreateForm = () => {
    setName("")
    setWarehouseId(null)
    setSelectedScopes(["INVENTORY_READ"])
  }

  const handleScopeChange = (scope: ApiKeyScope, checked: boolean) => {
    setSelectedScopes((previous) => {
      if (checked) {
        if (previous.includes(scope)) {
          return previous
        }

        return [...previous, scope]
      }

      return previous.filter((value) => value !== scope)
    })
  }

  const handleCreateApiKey = async () => {
    const trimmedName = name.trim()

    if (trimmedName.length < 3) {
      toast.error(t("generated.admin.apiKeys.nameTooShort"))
      return
    }

    if (selectedScopes.length < 1) {
      toast.error(t("generated.admin.apiKeys.selectAtLeastOneScope"))
      return
    }

    const payload: CreateApiKeyInput = {
      name: trimmedName,
      scopes: selectedScopes,
    }

    if (warehouseId != null) {
      payload.warehouseId = warehouseId
    }

    const created = await createApiKeyMutation.mutateAsync(payload)

    setCreatedApiKey({
      id: created.id,
      rawKey: created.rawKey,
      keyPrefix: created.keyPrefix,
      name: created.name,
      warehouseName: created.warehouseName,
      scopes: created.scopes,
      createdAt: created.createdAt,
    })
    setCopiedRawKey(false)
    setIsCreateDialogOpen(false)
    resetCreateForm()
    toast.success(
      t("generated.admin.apiKeys.createdToast", {
        value0: created.name,
      })
    )
  }

  const handleDeleteApiKey = async () => {
    if (apiKeyToDeleteId == null) {
      return
    }

    await deleteApiKeyMutation.mutateAsync(apiKeyToDeleteId)

    const deletedName = apiKeyToDelete?.name ?? `#${apiKeyToDeleteId}`
    toast.success(
      t("generated.admin.apiKeys.deletedToast", {
        value0: deletedName,
      })
    )

    if (detailsApiKeyId === apiKeyToDeleteId) {
      setDetailsApiKeyId(null)
    }

    setApiKeyToDeleteId(null)
  }

  const handleCopyRawKey = async () => {
    if (!createdApiKey) {
      return
    }

    try {
      await navigator.clipboard.writeText(createdApiKey.rawKey)
      setCopiedRawKey(true)
      toast.success(t("generated.admin.apiKeys.copiedToast"))
    } catch {
      toast.error(t("generated.admin.apiKeys.copyFailedToast"))
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setIsCreateDialogOpen(true)
              }}
            >
              <HugeiconsIcon className="mr-1.5 size-4" icon={Add01Icon} />
              {t("generated.admin.apiKeys.createAction")}
            </Button>
            <Button
              onClick={async () => {
                await refetchApiKeys()
              }}
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon
                className={
                  isRefetching ? "mr-1.5 size-4 animate-spin" : "mr-1.5 size-4"
                }
                icon={RefreshIcon}
              />
              {t("generated.admin.apiKeys.refreshAction")}
            </Button>
          </div>
        }
        description={t("generated.admin.apiKeys.pageDescription")}
        icon={Key01Icon}
        title={t("generated.shared.apiKeys")}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("generated.admin.apiKeys.totalKeys")}
          value={apiKeys.length}
        />
        <StatCard
          label={t("generated.admin.apiKeys.activeKeys")}
          value={activeKeysCount}
        />
        <StatCard
          label={t("generated.admin.apiKeys.neverUsedKeys")}
          value={neverUsedKeysCount}
        />
      </div>

      {isApiKeysPending && <ApiKeysLoadingState />}

      {isApiKeysError && !isApiKeysPending && (
        <Card className="p-6">
          <ErrorEmptyState
            onRetry={async () => {
              await refetchApiKeys()
            }}
          />
        </Card>
      )}

      {hasLoadedApiKeys && apiKeys.length === 0 && (
        <Card className="p-6">
          <EmptyState
            action={{
              label: t("generated.admin.apiKeys.createFirstAction"),
              onClick: () => {
                setIsCreateDialogOpen(true)
              },
            }}
            description={t("generated.admin.apiKeys.emptyDescription")}
            title={t("generated.admin.apiKeys.emptyTitle")}
            variant="noItems"
          />
        </Card>
      )}

      {hasLoadedApiKeys && apiKeys.length > 0 && (
        <ApiKeysTable
          apiKeys={apiKeys}
          onDelete={setApiKeyToDeleteId}
          onView={setDetailsApiKeyId}
        />
      )}

      <Dialog
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            resetCreateForm()
          }
        }}
        open={isCreateDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("generated.admin.apiKeys.createDialogTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("generated.admin.apiKeys.createDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault()
              await handleCreateApiKey()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="api-key-name">
                {t("generated.admin.apiKeys.nameLabel")}
              </Label>
              <Input
                id="api-key-name"
                maxLength={100}
                onChange={(event) => {
                  setName(event.target.value)
                }}
                placeholder={t("generated.admin.apiKeys.namePlaceholder")}
                value={name}
              />
              <p className="text-muted-foreground text-xs">
                {t("generated.admin.apiKeys.nameHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("generated.shared.warehouse")}</Label>
              <WarehouseSelector
                allOptionLabel={t("generated.admin.apiKeys.allWarehouses")}
                includeAllOption
                onValueChange={(nextWarehouseId) => {
                  setWarehouseId(nextWarehouseId)
                }}
                placeholder={t("generated.shared.searchWarehouse")}
                value={warehouseId}
              />
              <p className="text-muted-foreground text-xs">
                {t("generated.admin.apiKeys.warehouseHint")}
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-medium text-sm">
                {t("generated.admin.apiKeys.scopesLabel")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {API_KEY_SCOPES.map((scope) => {
                  const labelKey = `generated.admin.apiKeys.scopes.${scope}`
                  const descriptionKey = `generated.admin.apiKeys.scopeDescriptions.${scope}`
                  const checkboxId = `api-key-scope-${scope}`
                  const checked = selectedScopes.includes(scope)

                  return (
                    <label
                      className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/10 p-3 transition-colors hover:bg-muted/20"
                      htmlFor={checkboxId}
                      key={scope}
                    >
                      <Checkbox
                        checked={checked}
                        id={checkboxId}
                        onCheckedChange={(value) => {
                          handleScopeChange(scope, value === true)
                        }}
                      />
                      <span className="space-y-1">
                        <span className="block font-medium text-sm">
                          {t(labelKey)}
                        </span>
                        <span className="block text-muted-foreground text-xs">
                          {t(descriptionKey)}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setIsCreateDialogOpen(false)
                }}
                type="button"
                variant="outline"
              >
                {t("generated.shared.cancel")}
              </Button>
              <Button isLoading={createApiKeyMutation.isPending} type="submit">
                {t("generated.admin.apiKeys.createAction")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ApiKeyDetailsDialog
        apiKeyId={detailsApiKeyId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsApiKeyId(null)
          }
        }}
      />

      <NewApiKeyDialog
        copied={copiedRawKey}
        createdApiKey={createdApiKey}
        onClose={() => {
          setCreatedApiKey(null)
          setCopiedRawKey(false)
        }}
        onCopy={async () => {
          await handleCopyRawKey()
        }}
      />

      <ConfirmDialog
        description={t("generated.admin.apiKeys.deleteDescription", {
          value0: apiKeyToDelete?.name ?? "",
        })}
        onConfirm={async () => {
          await handleDeleteApiKey()
        }}
        onOpenChange={(open) => {
          if (!open) {
            setApiKeyToDeleteId(null)
          }
        }}
        open={apiKeyToDeleteId != null}
        title={t("generated.admin.apiKeys.deleteTitle")}
      />
    </div>
  )
}
