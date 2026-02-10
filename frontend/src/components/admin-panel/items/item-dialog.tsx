"use client"

import {
  AlertDiamondIcon,
  Camera01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Comment01Icon,
  DangerIcon,
  ImageUploadIcon,
  RefreshIcon,
  RulerIcon,
  Tag01Icon,
  ThermometerIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm, useStore } from "@tanstack/react-form"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { FormDialog } from "@/components/admin-panel/components/dialogs"
import type { IconComponent, Item } from "@/components/dashboard/types"
import { FieldWithState } from "@/components/helpers/field-state"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldContent, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useUploadItemPhoto } from "@/hooks/use-items"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"

export interface ItemFormData {
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

const DEFAULT_ITEM: ItemFormData = {
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
}

interface ItemDialogProps {
  currentRow?: Item
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ItemFormData) => Promise<number | undefined>
}

function mapItemToFormData(item: Item): ItemFormData {
  return {
    name: item.name,
    minTemp: item.minTemp,
    maxTemp: item.maxTemp,
    weight: item.weight,
    width: item.width,
    height: item.height,
    depth: item.depth,
    comment: item.comment,
    daysToExpiry: item.daysToExpiry,
    isDangerous: item.isDangerous,
  }
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

type PhotoStep = "prompt" | "camera" | "preview"

function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const streamRef = useRef<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsActive(true)
    } catch {
      setError(translateMessage("generated.m0202"))
    }
  }, [videoRef])

  const stop = useCallback(() => {
    const stream = streamRef.current
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
    setError(null)
  }, [videoRef])

  const capture = useCallback((): File | null => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return null
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    let result: File | null = null
    canvas.toBlob(
      (blob) => {
        if (blob) {
          result = new File([blob], "photo.jpg", { type: "image/jpeg" })
        }
      },
      "image/jpeg",
      0.85
    )

    // toBlob with jpeg is synchronous in most browsers, but use fallback
    if (!result) {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
      const byteString = atob(dataUrl.split(",")[1])
      const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0]
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      result = new File([ab], "photo.jpg", { type: mimeString })
    }

    return result
  }, [videoRef])

  return { isActive, error, start, stop, capture }
}

function CameraView({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { isActive, error, start, stop, capture } = useCamera(videoRef)

  useEffect(() => {
    start()
    return () => {
      stop()
    }
  }, [start, stop])

  const handleCapture = () => {
    const file = capture()
    if (file) {
      stop()
      onCapture(file)
    }
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      <div className="relative w-full overflow-hidden rounded-lg bg-black">
        <video
          autoPlay
          className="aspect-4/3 w-full object-cover"
          muted
          playsInline
          ref={videoRef}
        />
        {!(isActive || error) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner className="size-8 text-white" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
            <p className="text-sm text-white/80">{error}</p>
            <Button onClick={start} size="sm" variant="outline">
              <HugeiconsIcon className="mr-1.5 size-4" icon={RefreshIcon} />
              {translateMessage("generated.m0203")}
            </Button>
          </div>
        )}
      </div>

      <div className="flex w-full items-center justify-between">
        <Button onClick={onCancel} size="sm" variant="ghost">
          <HugeiconsIcon className="mr-1.5 size-4" icon={Cancel01Icon} />
          {translateMessage("generated.m0885")}
        </Button>
        <button
          aria-label={translateMessage("generated.m0204")}
          className="flex size-14 items-center justify-center rounded-full border-4 border-primary bg-primary/10 transition-colors hover:bg-primary/20 active:bg-primary/30 disabled:opacity-50"
          disabled={!isActive}
          onClick={handleCapture}
          type="button"
        >
          <div className="size-10 rounded-full bg-primary" />
        </button>
        <div className="w-19" />
      </div>
    </div>
  )
}

export function PhotoPromptDialog({
  itemId,
  open,
  onOpenChange,
  hasExistingPhoto = false,
}: {
  itemId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  hasExistingPhoto?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadItemPhoto()
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [step, setStep] = useState<PhotoStep>("prompt")
  const previewsRef = useRef<string[]>([])

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
    setStep("prompt")
  }, [preview])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      cleanup()
    }
    onOpenChange(isOpen)
  }

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
  }

  const handleCameraCapture = (file: File) => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }

    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setStep("preview")
  }

  const handleUpload = async () => {
    if (!selectedFile || itemId === null) {
      return
    }

    try {
      await uploadMutation.mutateAsync({ itemId, photo: selectedFile })
      toast.success(
        hasExistingPhoto
          ? translateMessage("generated.m1131")
          : translateMessage("generated.m1132")
      )
      cleanup()
      onOpenChange(false)
    } catch {
      // Error handled by useApiMutation
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={step === "prompt"}
      >
        <input
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />

        {step === "prompt" && (
          <>
            <DialogHeader>
              <DialogTitle>
                {hasExistingPhoto
                  ? translateMessage("generated.m1120")
                  : translateMessage("generated.m1121")}
              </DialogTitle>
              <DialogDescription>
                {hasExistingPhoto
                  ? translateMessage("generated.m1122")
                  : translateMessage("generated.m1123")}
              </DialogDescription>
            </DialogHeader>

            {hasExistingPhoto && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
                <HugeiconsIcon
                  className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                  icon={AlertDiamondIcon}
                />
                <p className="text-amber-800 text-sm leading-snug dark:text-amber-200">
                  {translateMessage("generated.m0205")}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                className="flex flex-col items-center gap-3 rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/20 p-6 transition-colors hover:border-primary/40 hover:bg-muted/40"
                onClick={() => setStep("camera")}
                type="button"
              >
                <HugeiconsIcon
                  className="size-8 text-muted-foreground/60"
                  icon={Camera01Icon}
                />
                <span className="font-medium text-sm">
                  {translateMessage("generated.m0204")}
                </span>
              </button>
              <button
                className="flex flex-col items-center gap-3 rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/20 p-6 transition-colors hover:border-primary/40 hover:bg-muted/40"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <HugeiconsIcon
                  className="size-8 text-muted-foreground/60"
                  icon={ImageUploadIcon}
                />
                <span className="font-medium text-sm">
                  {translateMessage("generated.m0206")}
                </span>
              </button>
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)} variant="ghost">
                {hasExistingPhoto
                  ? translateMessage("generated.m0885")
                  : translateMessage("generated.m1133")}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "camera" && (
          <CameraView
            onCancel={() => setStep("prompt")}
            onCapture={handleCameraCapture}
          />
        )}

        {step === "preview" && preview && (
          <>
            <DialogHeader>
              <DialogTitle>{translateMessage("generated.m0207")}</DialogTitle>
            </DialogHeader>

            <div className="overflow-hidden rounded-lg border bg-muted/30">
              {/* biome-ignore lint/performance/noImgElement: blob URLs are not supported by next/image */}
              <img
                alt={translateMessage("generated.m0207")}
                className="mx-auto max-h-64 object-contain"
                height={256}
                src={preview}
                width={384}
              />
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    cleanup()
                    setStep("camera")
                  }}
                  size="sm"
                  variant="outline"
                >
                  <HugeiconsIcon
                    className="mr-1.5 size-4"
                    icon={Camera01Icon}
                  />
                  {translateMessage("generated.m0919")}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  variant="outline"
                >
                  <HugeiconsIcon
                    className="mr-1.5 size-4"
                    icon={ImageUploadIcon}
                  />
                  {translateMessage("generated.m0920")}
                </Button>
              </div>
              <Button
                isLoading={uploadMutation.isPending}
                onClick={handleUpload}
                size="sm"
              >
                <HugeiconsIcon
                  className="mr-1.5 size-4"
                  icon={CheckmarkCircle01Icon}
                />
                {translateMessage("generated.m0915")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ItemDialog({
  currentRow,
  open,
  onOpenChange,
  onSubmit,
}: ItemDialogProps) {
  const isEdit = !!currentRow
  const [photoPromptOpen, setPhotoPromptOpen] = useState(false)
  const [createdItemId, setCreatedItemId] = useState<number | null>(null)
  const [pendingFormReset, setPendingFormReset] = useState(false)

  const formValues: ItemFormData = currentRow
    ? mapItemToFormData(currentRow)
    : DEFAULT_ITEM

  const form = useForm({
    defaultValues: formValues,
    onSubmit: async ({ value }) => {
      const result = await onSubmit({
        name: value.name,
        minTemp: value.minTemp,
        maxTemp: value.maxTemp,
        weight: value.weight || 0,
        width: value.width || 0,
        height: value.height || 0,
        depth: value.depth || 0,
        comment: value.comment || undefined,
        daysToExpiry: value.daysToExpiry || 30,
        isDangerous: value.isDangerous,
      })

      onOpenChange(false)
      setPendingFormReset(true)

      if (!isEdit && typeof result === "number") {
        setCreatedItemId(result)
        setPhotoPromptOpen(true)
      }
    },
  })

  useEffect(() => {
    if (currentRow) {
      form.reset(mapItemToFormData(currentRow))
      return
    }

    form.reset(DEFAULT_ITEM)
  }, [currentRow, form])

  useEffect(() => {
    if (open || !pendingFormReset) {
      return
    }

    form.reset(currentRow ? mapItemToFormData(currentRow) : DEFAULT_ITEM)
    setPendingFormReset(false)
  }, [currentRow, form, open, pendingFormReset])

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <>
      <FormDialog
        description={
          isEdit
            ? translateMessage("generated.m1134")
            : translateMessage("generated.m1135")
        }
        formId="item-form"
        isLoading={isSubmitting}
        onFormReset={() => setPendingFormReset(true)}
        onOpenChange={onOpenChange}
        open={open}
        title={
          isEdit
            ? translateMessage("generated.m1136")
            : translateMessage("generated.m1137")
        }
      >
        <form
          className="space-y-5 px-0.5 py-4"
          id="item-form"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          {/* -- Identyfikacja -- */}
          <section className="space-y-3">
            <SectionHeader
              icon={Tag01Icon}
              title={translateMessage("generated.m0921")}
            />
            <FieldGroup className="gap-4">
              <form.Field name="name">
                {(field) => (
                  <FieldWithState
                    autoComplete="off"
                    field={field}
                    label={translateMessage("generated.m0922")}
                    layout="grid"
                    placeholder={translateMessage("generated.m0208")}
                  />
                )}
              </form.Field>
            </FieldGroup>
          </section>

          <Separator />

          {/* -- Warunki przechowywania -- */}
          <section className="space-y-3">
            <SectionHeader
              icon={ThermometerIcon}
              title={translateMessage("generated.m0923")}
            />
            <FieldGroup className="gap-4">
              <div className="grid grid-cols-6 items-center gap-x-4 gap-y-1">
                <span className="col-span-2 text-start font-medium text-sm">
                  {translateMessage("generated.m0924")}
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
                        placeholder={translateMessage("generated.m0209")}
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
                        placeholder={translateMessage("generated.m0210")}
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
                    label={translateMessage("generated.m0211")}
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
                      {translateMessage("generated.m0925")}
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
                          <HugeiconsIcon className="size-3" icon={DangerIcon} />
                          {translateMessage("generated.m0212")}
                        </span>
                      )}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          </section>

          <Separator />

          {/* -- Wymiary fizyczne -- */}
          <section className="space-y-3">
            <SectionHeader
              icon={RulerIcon}
              title={translateMessage("generated.m0213")}
            />
            <FieldGroup className="gap-4">
              <form.Field name="weight">
                {(field) => (
                  <FieldWithState
                    field={field}
                    label={translateMessage("generated.m0214")}
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
                  {translateMessage("generated.m0215")}
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
                        placeholder={translateMessage("generated.m0926")}
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
                        placeholder={translateMessage("generated.m0927")}
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
                        placeholder={translateMessage("generated.m0928")}
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

          {/* -- Komentarz -- */}
          <section className="space-y-3">
            <SectionHeader
              icon={Comment01Icon}
              title={translateMessage("generated.m0929")}
            />
            <FieldGroup className="gap-4">
              <form.Field name="comment">
                {(field) => (
                  <FieldWithState
                    field={field}
                    fieldClassName="items-start"
                    label={translateMessage("generated.m0930")}
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
                        placeholder={translateMessage("generated.m0216")}
                        rows={3}
                        value={field.state.value ?? ""}
                      />
                    )}
                  />
                )}
              </form.Field>
            </FieldGroup>
          </section>
        </form>
      </FormDialog>

      <PhotoPromptDialog
        itemId={createdItemId}
        onOpenChange={setPhotoPromptOpen}
        open={photoPromptOpen}
      />
    </>
  )
}
