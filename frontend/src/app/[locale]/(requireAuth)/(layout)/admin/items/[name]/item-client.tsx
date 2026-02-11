"use client"

import {
  CheckmarkCircle01Icon,
  Comment01Icon,
  DangerIcon,
  Delete02Icon,
  Image01Icon,
  ImageUploadIcon,
  RefreshIcon,
  RulerIcon,
  StarIcon,
  Tag01Icon,
  ThermometerIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm, useStore } from "@tanstack/react-form"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { AdminPageHeader } from "@/components/admin-panel/components/admin-page-header"
import type { IconComponent } from "@/components/dashboard/types"
import { FieldWithState } from "@/components/helpers/field-state"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { parseImageSrc } from "@/components/ui/item-photo"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import useItems, {
  useDeleteItemPhoto,
  useItemPhotos,
  useSetPrimaryItemPhoto,
  useUpdateItem,
  useUploadItemPhoto,
} from "@/hooks/use-items"
import { cn } from "@/lib/utils"

const MAX_PHOTOS = 10

const parseIntegerFromQueryParam = (value: string | null): number | null => {
  if (!value) {
    return null
  }

  const parsedValue = Number.parseInt(value, 10)
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null
  }

  return parsedValue
}

interface ItemFormData {
  name: string
  minTemp: number
  maxTemp: number
  weight: number
  width: number
  height: number
  depth: number
  comment?: string
  daysToExpiry: number
  isDangerous: boolean
}

function SectionHeader({
  icon,
  title,
}: {
  icon: IconComponent
  title: string
}) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-1">
      <HugeiconsIcon className="size-3.5 text-muted-foreground" icon={icon} />
      <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {title}
      </span>
    </div>
  )
}

type PhotoUploadStep = "idle" | "preview"

function PhotoUploadSection({
  itemId,
  currentCount,
}: {
  itemId: number
  currentCount: number
}) {
  const t = useTranslations()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadItemPhoto()
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [step, setStep] = useState<PhotoUploadStep>("idle")
  const previewsRef = useRef<string[]>([])

  const canUpload = currentCount < MAX_PHOTOS

  useEffect(() => {
    previewsRef.current.push(preview ?? "")
    return () => {
      for (const url of previewsRef.current) {
        if (url) {
          URL.revokeObjectURL(url)
        }
      }
      previewsRef.current = []
    }
  }, [preview])

  const cleanup = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setSelectedFile(null)
    setStep("idle")
  }, [preview])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setStep("preview")
    // Reset input so same file can be re-selected
    e.target.value = ""
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      return
    }
    try {
      await uploadMutation.mutateAsync({ itemId, photo: selectedFile })
      toast.success(t("generated.admin.items.addedProductPhoto"))
      cleanup()
    } catch {
      // Error handled by useApiMutation
    }
  }

  if (!canUpload && step === "idle") {
    return (
      <p className="text-muted-foreground text-sm">
        {t("generated.admin.items.detail.maxPhotosReached", {
          value0: MAX_PHOTOS.toString(),
        })}
      </p>
    )
  }

  if (step === "preview" && preview) {
    return (
      <div className="space-y-4">
        <div className="max-w-sm overflow-hidden rounded-lg border bg-muted/30">
          {/* biome-ignore lint/performance/noImgElement: blob URLs are not supported by next/image */}
          <img
            alt={t("generated.admin.items.photoPreview")}
            className="mx-auto max-h-64 object-contain"
            height={256}
            src={preview}
            width={384}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon className="mr-1.5 size-4" icon={ImageUploadIcon} />
            {t("generated.admin.items.change")}
          </Button>
          <Button
            isLoading={uploadMutation.isPending}
            onClick={handleUpload}
            size="sm"
          >
            <HugeiconsIcon
              className="mr-1.5 size-4"
              icon={CheckmarkCircle01Icon}
            />
            {t("generated.admin.shared.save")}
          </Button>
        </div>
        <input
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        ref={fileInputRef}
        type="file"
      />
      <div className="flex gap-2">
        <Button
          disabled={!canUpload}
          onClick={() => fileInputRef.current?.click()}
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon className="mr-1.5 size-4" icon={ImageUploadIcon} />
          {t("generated.admin.items.selectFile")}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        {currentCount}/{MAX_PHOTOS}
      </p>
    </div>
  )
}

function PhotoGallery({ itemId }: { itemId: number }) {
  const t = useTranslations()
  const {
    data: photos,
    isPending,
    isError,
    refetch,
  } = useItemPhotos({ itemId })
  const deleteMutation = useDeleteItemPhoto()
  const setPrimaryMutation = useSetPrimaryItemPhoto()

  const handleDelete = async (imageId: number) => {
    try {
      await deleteMutation.mutateAsync({ itemId, imageId })
      toast.success(t("generated.admin.items.photoDeleted"))
    } catch {
      // Error handled by useApiMutation
    }
  }

  const handleSetPrimary = async (imageId: number) => {
    try {
      await setPrimaryMutation.mutateAsync({ itemId, imageId })
      toast.success(t("generated.admin.items.primaryPhotoSet"))
    } catch {
      // Error handled by useApiMutation
    }
  }

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton
            className="aspect-square rounded-lg"
            key={`photo-skeleton-${i.toString()}`}
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          {t("generated.shared.errorOccurred")}
        </p>
        <Button onClick={() => refetch()} size="sm" variant="outline">
          <HugeiconsIcon className="mr-1.5 size-4" icon={RefreshIcon} />
          {t("generated.shared.tryAgain")}
        </Button>
      </div>
    )
  }

  const photosList = photos ?? []

  return (
    <div className="space-y-4">
      {photosList.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photosList.map((photo) => {
            const src = parseImageSrc(`/api/items/${itemId}/photos/${photo.id}`)
            return (
              <div
                className="group relative overflow-hidden rounded-lg border bg-muted/30"
                key={photo.id}
              >
                <div className="aspect-square">
                  {src ? (
                    // biome-ignore lint/performance/noImgElement: API images need auth headers
                    <img
                      alt={`${photo.id}`}
                      className="size-full object-cover"
                      height={256}
                      src={src}
                      width={256}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <HugeiconsIcon
                        className="size-8 text-muted-foreground/40"
                        icon={Image01Icon}
                      />
                    </div>
                  )}
                </div>

                {photo.primary && (
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 font-medium text-primary-foreground text-xs shadow-sm">
                    <HugeiconsIcon className="size-3" icon={StarIcon} />
                    {t("generated.admin.items.primaryLabel")}
                  </div>
                )}

                <div className="absolute right-1.5 bottom-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!photo.primary && (
                    <button
                      aria-label={t("generated.admin.items.setAsPrimary")}
                      className="flex size-7 items-center justify-center rounded-md bg-background/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                      disabled={setPrimaryMutation.isPending}
                      onClick={() => handleSetPrimary(photo.id)}
                      type="button"
                    >
                      <HugeiconsIcon className="size-3.5" icon={StarIcon} />
                    </button>
                  )}
                  <button
                    aria-label={t("generated.shared.remove")}
                    className="flex size-7 items-center justify-center rounded-md bg-background/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    disabled={deleteMutation.isPending}
                    onClick={() => handleDelete(photo.id)}
                    type="button"
                  >
                    <HugeiconsIcon className="size-3.5" icon={Delete02Icon} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
          <HugeiconsIcon
            className="size-8 text-muted-foreground/40"
            icon={Image01Icon}
          />
          <p className="text-muted-foreground text-sm">
            {t("generated.admin.items.noPhotosYet")}
          </p>
        </div>
      )}

      <PhotoUploadSection currentCount={photosList.length} itemId={itemId} />
    </div>
  )
}

export default function ItemClient() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedItemIdFromSearchParams = useMemo(
    () => parseIntegerFromQueryParam(searchParams.get("itemId")),
    [searchParams]
  )
  const itemId = requestedItemIdFromSearchParams ?? -1

  const {
    data: itemData,
    isPending: isItemPending,
    isError: isItemError,
    refetch: refetchItem,
  } = useItems({ itemId }, { enabled: itemId > 0 })

  const updateItemMutation = useUpdateItem()

  const form = useForm({
    defaultValues: {
      name: "",
      minTemp: 0,
      maxTemp: 25,
      weight: 0,
      width: 0,
      height: 0,
      depth: 0,
      comment: "",
      daysToExpiry: 30,
      isDangerous: false,
    } as ItemFormData,
    onSubmit: async ({ value }) => {
      const trimmedName = value.name.trim()
      const trimmedComment = value.comment?.trim()

      await updateItemMutation.mutateAsync({
        itemId,
        name: trimmedName.length > 0 ? trimmedName : undefined,
        minTemp: value.minTemp,
        maxTemp: value.maxTemp,
        weight: value.weight || 0,
        sizeX: value.width || 0,
        sizeY: value.height || 0,
        sizeZ: value.depth || 0,
        comment:
          trimmedComment && trimmedComment.length > 0
            ? trimmedComment
            : undefined,
        expireAfterDays: value.daysToExpiry || 30,
        dangerous: value.isDangerous,
      })

      toast.success(t("generated.admin.items.itemUpdated"))
      router.push("/admin/items")
    },
  })

  useEffect(() => {
    if (!itemData) {
      return
    }
    form.reset({
      name: itemData.name,
      minTemp: itemData.minTemp,
      maxTemp: itemData.maxTemp,
      weight: itemData.weight,
      width: itemData.sizeX,
      height: itemData.sizeY,
      depth: itemData.sizeZ,
      comment: itemData.comment ?? "",
      daysToExpiry: itemData.expireAfterDays,
      isDangerous: itemData.dangerous,
    })
  }, [itemData, form])

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  if (isItemPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="space-y-4 rounded-xl border bg-card p-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              className="h-10 w-full"
              key={`form-skeleton-${i.toString()}`}
            />
          ))}
        </div>
      </div>
    )
  }

  if (isItemError || !itemData) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          backHref="/admin/items"
          title={t("generated.admin.items.editProduct")}
        />
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            {t("generated.shared.errorOccurred")}
          </p>
          <Button onClick={() => refetchItem()} variant="outline">
            <HugeiconsIcon className="mr-1.5 size-4" icon={RefreshIcon} />
            {t("generated.shared.tryAgain")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref="/admin/items"
        description={t("generated.admin.items.changeProductParameters")}
        title={itemData.name}
        titleBadge={`#${itemData.id}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        {/* ── Edit Form ────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h2 className="font-semibold text-lg">
              {t("generated.admin.items.editProduct")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("generated.admin.items.changeProductParameters")}
            </p>
          </div>

          <form
            className="space-y-5 p-6"
            id="item-edit-form"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            {/* Identification */}
            <section className="space-y-3">
              <SectionHeader
                icon={Tag01Icon}
                title={t("generated.admin.shared.identification")}
              />
              <FieldGroup className="gap-4">
                <form.Field name="name">
                  {(field) => (
                    <FieldWithState
                      autoComplete="off"
                      field={field}
                      label={t("generated.shared.name")}
                      layout="grid"
                      placeholder={t("generated.admin.items.milk32")}
                    />
                  )}
                </form.Field>
              </FieldGroup>
            </section>

            <Separator />

            {/* Storage Conditions */}
            <section className="space-y-3">
              <SectionHeader
                icon={ThermometerIcon}
                title={t("generated.admin.shared.storage")}
              />
              <FieldGroup className="gap-4">
                <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                  <span className="col-span-2 text-start font-medium text-sm">
                    {t("generated.shared.temperature")}
                  </span>
                  <div className="col-span-4 flex items-center gap-2">
                    <form.Field name="minTemp">
                      {(field) => (
                        <Input
                          className="w-full"
                          id={field.name}
                          name={field.name}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          placeholder={t("generated.admin.shared.minC")}
                          type="number"
                          value={field.state.value}
                        />
                      )}
                    </form.Field>
                    <span className="shrink-0 text-muted-foreground">–</span>
                    <form.Field name="maxTemp">
                      {(field) => (
                        <Input
                          className="w-full"
                          id={field.name}
                          name={field.name}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          placeholder={t("generated.admin.shared.maxC")}
                          type="number"
                          value={field.state.value}
                        />
                      )}
                    </form.Field>
                  </div>
                </div>

                <form.Field name="daysToExpiry">
                  {(field) => (
                    <FieldWithState
                      field={field}
                      label={t("generated.admin.items.shelfLifeDays")}
                      layout="grid"
                      renderInput={({ id, isInvalid }) => (
                        <Input
                          className={isInvalid ? "border-destructive" : ""}
                          id={id}
                          min={1}
                          name={field.name}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          placeholder="30"
                          type="number"
                          value={field.state.value}
                        />
                      )}
                    />
                  )}
                </form.Field>

                <form.Field name="isDangerous">
                  {(field) => (
                    <Field className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                      <Label
                        className="col-span-2 cursor-pointer text-nowrap text-end"
                        htmlFor={field.name}
                      >
                        {t("generated.shared.dangerous")}
                      </Label>
                      <FieldContent className="col-span-4 flex items-center gap-2.5">
                        <Checkbox
                          checked={field.state.value}
                          id={field.name}
                          onCheckedChange={(checked) =>
                            field.handleChange(checked === true)
                          }
                        />
                        {field.state.value && (
                          <span className="flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-destructive text-xs">
                            <HugeiconsIcon
                              className="size-3"
                              icon={DangerIcon}
                            />
                            {t("generated.admin.items.hazardousMaterial")}
                          </span>
                        )}
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>
            </section>

            <Separator />

            {/* Physical Dimensions */}
            <section className="space-y-3">
              <SectionHeader
                icon={RulerIcon}
                title={t("generated.admin.shared.physicalDimensions")}
              />
              <FieldGroup className="gap-4">
                <form.Field name="weight">
                  {(field) => (
                    <FieldWithState
                      field={field}
                      label={t("generated.admin.items.weightKg")}
                      layout="grid"
                      renderInput={({ id, isInvalid }) => (
                        <Input
                          className={isInvalid ? "border-destructive" : ""}
                          id={id}
                          min={0}
                          name={field.name}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          placeholder="1.0"
                          step="0.1"
                          type="number"
                          value={field.state.value}
                        />
                      )}
                    />
                  )}
                </form.Field>

                <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                  <span className="col-span-2 font-medium text-sm">
                    {t("generated.admin.items.dimensionsMm")}
                  </span>
                  <div className="col-span-4 flex items-center gap-2">
                    <form.Field name="width">
                      {(field) => (
                        <Input
                          className="w-full"
                          id={field.name}
                          min={0}
                          name={field.name}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          placeholder={t("generated.admin.shared.lat")}
                          type="number"
                          value={field.state.value}
                        />
                      )}
                    </form.Field>
                    <span className="shrink-0 text-muted-foreground">×</span>
                    <form.Field name="height">
                      {(field) => (
                        <Input
                          className="w-full"
                          id={field.name}
                          min={0}
                          name={field.name}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          placeholder={t("generated.admin.shared.height")}
                          type="number"
                          value={field.state.value}
                        />
                      )}
                    </form.Field>
                    <span className="shrink-0 text-muted-foreground">×</span>
                    <form.Field name="depth">
                      {(field) => (
                        <Input
                          className="w-full"
                          id={field.name}
                          min={0}
                          name={field.name}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          placeholder={t("generated.admin.items.main")}
                          type="number"
                          value={field.state.value}
                        />
                      )}
                    </form.Field>
                  </div>
                </div>
              </FieldGroup>
            </section>

            <Separator />

            {/* Comment */}
            <section className="space-y-3">
              <SectionHeader
                icon={Comment01Icon}
                title={t("generated.admin.shared.additional")}
              />
              <FieldGroup className="gap-4">
                <form.Field name="comment">
                  {(field) => (
                    <FieldWithState
                      field={field}
                      fieldClassName="items-start"
                      label={t("generated.shared.comment")}
                      labelClassName="pt-2 text-left"
                      layout="grid"
                      renderInput={({ id, isInvalid }) => (
                        <Textarea
                          className={cn("w-full resize-none", {
                            "border-destructive": isInvalid,
                          })}
                          id={id}
                          name={field.name}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={t(
                            "generated.admin.shared.optionalComment"
                          )}
                          rows={3}
                          value={field.state.value ?? ""}
                        />
                      )}
                    />
                  )}
                </form.Field>
              </FieldGroup>
            </section>

            <Separator />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={() => router.push("/admin/items")}
                type="button"
                variant="outline"
              >
                {t("generated.shared.cancel")}
              </Button>
              <Button
                form="item-edit-form"
                isLoading={isSubmitting}
                type="submit"
              >
                <HugeiconsIcon
                  className="mr-1.5 size-4"
                  icon={CheckmarkCircle01Icon}
                />
                {t("generated.admin.shared.save")}
              </Button>
            </div>
          </form>
        </div>

        {/* ── Photo Gallery ─────────────────────────── */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h2 className="font-semibold text-lg">
              {t("generated.admin.items.productPhotos")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("generated.admin.items.manageProductPhotos")}
            </p>
          </div>
          <div className="p-6">
            <PhotoGallery itemId={itemId} />
          </div>
        </div>
      </div>
    </div>
  )
}
