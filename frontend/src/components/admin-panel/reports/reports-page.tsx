"use client"

import {
  Calendar03Icon,
  Csv01Icon,
  DatabaseIcon,
  FileDownloadIcon,
  FilterIcon,
  Mail01Icon,
  PackageIcon,
  Pdf01Icon,
  ThermometerIcon,
  Xls01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  downloadReportBlob,
  mapToApiReportFormat,
  useGenerateExpiryReport,
  useGenerateInventoryStockReport,
  useGenerateTemperatureAlertReport,
} from "@/hooks/use-reports"
import { useAppTranslations } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"
import { WarehouseSelector } from "../backups/components/warehouse-selector"
import { AdminPageHeader } from "../components/admin-page-header"

type ReportType = "inventory" | "expiry" | "temperature"
type ReportFormat = "xlsx" | "pdf" | "csv"
type TemperatureSeverity = "ALL" | "WARNING" | "CRITICAL"
type DeliveryMode = "download" | "email"

const REPORT_FORMAT_EXTENSION: Record<ReportFormat, string> = {
  csv: "csv",
  pdf: "pdf",
  xlsx: "xlsx",
}

export default function ReportsMain() {
  const t = useAppTranslations()

  const [reportType, setReportType] = useState<ReportType>("inventory")
  const [reportFormat, setReportFormat] = useState<ReportFormat>("xlsx")
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("download")
  const [warehouseId, setWarehouseId] = useState<number | null>(null)
  const [warehouseName, setWarehouseName] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [expiryWindowDays, setExpiryWindowDays] = useState("14")
  const [temperatureSeverity, setTemperatureSeverity] =
    useState<TemperatureSeverity>("ALL")
  const generateTemperatureAlertReportMutation =
    useGenerateTemperatureAlertReport()
  const generateInventoryStockReportMutation = useGenerateInventoryStockReport()
  const generateExpiryReportMutation = useGenerateExpiryReport()

  const reportTypeOptions = useMemo(
    () =>
      [
        {
          description: t("generated.admin.reports.inventory.description"),
          icon: PackageIcon,
          label: t("generated.admin.reports.tabs.fullInventory"),
          value: "inventory",
        },
        {
          description: t("generated.admin.reports.expiry.description"),
          icon: Calendar03Icon,
          label: t("generated.admin.reports.tabs.expirySoon"),
          value: "expiry",
        },
        {
          description: t("generated.admin.reports.temperature.description"),
          icon: ThermometerIcon,
          label: t("generated.admin.reports.tabs.temperatureRanges"),
          value: "temperature",
        },
      ] as const,
    [t]
  )

  const formatOptions = useMemo(
    () =>
      [
        {
          icon: Xls01Icon,
          label: t("generated.admin.reports.formats.excel"),
          value: "xlsx",
        },
        {
          icon: Pdf01Icon,
          label: t("generated.admin.reports.formats.pdf"),
          value: "pdf",
        },
        {
          icon: Csv01Icon,
          label: t("generated.admin.reports.formats.csv"),
          value: "csv",
        },
      ] as const,
    [t]
  )

  const temperatureSeverityLabels = useMemo(
    (): Record<TemperatureSeverity, string> => ({
      ALL: t("generated.admin.reports.builder.severityAll"),
      CRITICAL: t("generated.admin.reports.builder.severityCriticalOnly"),
      WARNING: t("generated.admin.reports.builder.severityWarningAndCritical"),
    }),
    [t]
  )

  const selectedReport = reportTypeOptions.find(
    (option) => option.value === reportType
  )
  const selectedFormat = formatOptions.find(
    (option) => option.value === reportFormat
  )
  const deliveryOptions = useMemo(
    () =>
      [
        {
          description: t(
            "generated.admin.reports.builder.deliveryDownloadHint"
          ),
          icon: FileDownloadIcon,
          label: t("generated.admin.reports.builder.deliveryDownload"),
          value: "download",
        },
        {
          description: t("generated.admin.reports.builder.deliveryEmailHint"),
          icon: Mail01Icon,
          label: t("generated.admin.reports.builder.deliveryEmail"),
          value: "email",
        },
      ] as const,
    [t]
  )
  const selectedDeliveryOption = deliveryOptions.find(
    (option) => option.value === deliveryMode
  )
  const isGenerating =
    generateTemperatureAlertReportMutation.isPending ||
    generateInventoryStockReportMutation.isPending ||
    generateExpiryReportMutation.isPending

  const createReportFilename = (
    type: ReportType,
    format: ReportFormat
  ): string => {
    const extension = REPORT_FORMAT_EXTENSION[format]
    const dateStamp = new Date().toISOString().slice(0, 10)
    return `${type}-report-${dateStamp}.${extension}`
  }

  const handleReportOutput = ({
    response,
    sendEmail,
    type,
  }: {
    response: Blob | null
    sendEmail: boolean
    type: ReportType
  }): void => {
    if (sendEmail) {
      toast.success(t("generated.admin.reports.builder.emailSentSuccess"))
      return
    }

    if (!(response instanceof Blob)) {
      throw new Error("Expected report blob response")
    }

    downloadReportBlob(response, createReportFilename(type, reportFormat))
    toast.success(t("generated.admin.reports.shared.reportGenerated"))
  }

  const generateInventoryReport = async ({
    format,
    sendEmail,
    warehouseId,
  }: {
    format: ReturnType<typeof mapToApiReportFormat>
    sendEmail: boolean
    warehouseId: number | null
  }): Promise<void> => {
    const response = await generateInventoryStockReportMutation.mutateAsync({
      format,
      sendEmail,
      warehouseId,
    })
    handleReportOutput({
      response,
      sendEmail,
      type: "inventory",
    })
  }

  const generateExpiryStockReport = async ({
    format,
    sendEmail,
    warehouseId,
  }: {
    format: ReturnType<typeof mapToApiReportFormat>
    sendEmail: boolean
    warehouseId: number | null
  }): Promise<void> => {
    const parsedDaysAhead = Number.parseInt(expiryWindowDays, 10)
    if (Number.isNaN(parsedDaysAhead) || parsedDaysAhead < 0) {
      toast.error(t("generated.admin.reports.builder.invalidDaysUntilExpiry"))
      return
    }

    const response = await generateExpiryReportMutation.mutateAsync({
      format,
      sendEmail,
      warehouseId,
      daysAhead: parsedDaysAhead,
    })
    handleReportOutput({
      response,
      sendEmail,
      type: "expiry",
    })
  }

  const generateTemperatureReport = async ({
    format,
    sendEmail,
    warehouseId,
  }: {
    format: ReturnType<typeof mapToApiReportFormat>
    sendEmail: boolean
    warehouseId: number | null
  }): Promise<void> => {
    const response = await generateTemperatureAlertReportMutation.mutateAsync({
      format,
      sendEmail,
      warehouseId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    handleReportOutput({
      response,
      sendEmail,
      type: "temperature",
    })
  }

  const handleGenerateReport = async (): Promise<void> => {
    const sendEmail = deliveryMode === "email"
    const format = mapToApiReportFormat(reportFormat)

    try {
      if (reportType === "inventory") {
        await generateInventoryReport({ format, sendEmail, warehouseId })
        return
      }

      if (reportType === "expiry") {
        await generateExpiryStockReport({ format, sendEmail, warehouseId })
        return
      }

      await generateTemperatureReport({ format, sendEmail, warehouseId })
    } catch {
      toast.error(t("generated.admin.reports.shared.exportError"))
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description={t("generated.admin.reports.generateReports")}
        icon={DatabaseIcon}
        title={t("generated.shared.reports")}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Card className="relative border border-border/60 bg-linear-to-br from-card via-card to-primary/5">
            <div className="pointer-events-none absolute -top-14 -right-14 size-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_70%_120%,var(--primary)/0.04,transparent_60%)]" />

            <CardHeader className="border-border/70 border-b">
              <CardTitle className="text-lg">
                {t("generated.admin.reports.builder.title")}
              </CardTitle>
              <CardDescription>
                {t("generated.admin.reports.builder.description")}
              </CardDescription>
            </CardHeader>

            <CardContent className="@container space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs ring-1 ring-primary/20">
                    1
                  </span>
                  <Label
                    className="font-medium text-sm"
                    htmlFor="report-type-inventory"
                  >
                    {t("generated.admin.reports.columns.type")}
                  </Label>
                </div>

                <RadioGroup
                  className="grid @3xl:grid-cols-3 gap-3"
                  onValueChange={(value) => {
                    setReportType(value as ReportType)
                  }}
                  value={reportType}
                >
                  {reportTypeOptions.map((option) => {
                    const isActive = reportType === option.value

                    return (
                      <div className="flex" key={option.value}>
                        <RadioGroupItem
                          className="peer sr-only"
                          id={`report-type-${option.value}`}
                          value={option.value}
                        />
                        <Label
                          className={cn(
                            "flex flex-1 cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-all",
                            isActive
                              ? "border-primary bg-primary/5"
                              : "border-border/70 bg-background/70 hover:border-primary/40 hover:bg-muted/40"
                          )}
                          htmlFor={`report-type-${option.value}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-md border",
                                isActive
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border/70 bg-muted/60 text-muted-foreground"
                              )}
                            >
                              <HugeiconsIcon
                                className="size-4"
                                icon={option.icon}
                              />
                            </span>
                            <div className="space-y-1">
                              <p className="font-medium text-sm leading-tight">
                                {option.label}
                              </p>
                              <p className="text-muted-foreground text-xs leading-tight">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs ring-1 ring-primary/20">
                    2
                  </span>
                  <Label className="font-medium text-sm">
                    {t("generated.admin.reports.shared.selectFileFormat")}
                    {" & "}
                    {t("generated.admin.reports.builder.warehouseOptional")}
                  </Label>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="report-format">
                    {t("generated.admin.reports.shared.selectFileFormat")}
                  </Label>
                  <Select
                    onValueChange={(value) => {
                      setReportFormat(value as ReportFormat)
                    }}
                    value={reportFormat}
                  >
                    <SelectTrigger className="w-full" id="report-format">
                      <SelectValue
                        render={
                          <span>
                            {selectedFormat?.label ??
                              t("generated.admin.reports.formats.selectFormat")}
                          </span>
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {formatOptions.map((formatOption) => (
                        <SelectItem
                          key={formatOption.value}
                          value={formatOption.value}
                        >
                          <HugeiconsIcon
                            className="size-4"
                            icon={formatOption.icon}
                          />
                          <span>{formatOption.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warehouse-filter">
                    {t("generated.admin.reports.builder.warehouseOptional")}
                  </Label>
                  <WarehouseSelector
                    allOptionLabel={t(
                      "generated.admin.reports.builder.summaryAllWarehouses"
                    )}
                    id="warehouse-filter"
                    includeAllOption
                    onValueChange={(nextWarehouseId, nextWarehouseName) => {
                      setWarehouseId(nextWarehouseId)
                      setWarehouseName(nextWarehouseName)
                    }}
                    value={warehouseId}
                  />
                </div>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs ring-1 ring-primary/20">
                    3
                  </span>
                  <Label className="font-medium text-sm">
                    {t("generated.admin.reports.builder.deliveryMethod")}
                  </Label>
                </div>

                <RadioGroup
                  className="grid gap-3 sm:grid-cols-2"
                  onValueChange={(value) => {
                    setDeliveryMode(value as DeliveryMode)
                  }}
                  value={deliveryMode}
                >
                  {deliveryOptions.map((option) => {
                    const isActive = deliveryMode === option.value

                    return (
                      <div className="flex" key={option.value}>
                        <RadioGroupItem
                          className="peer sr-only"
                          id={`delivery-mode-${option.value}`}
                          value={option.value}
                        />
                        <Label
                          className={cn(
                            "flex flex-1 cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-all",
                            isActive
                              ? "border-primary bg-primary/5"
                              : "border-border/70 bg-background/70 hover:border-primary/40 hover:bg-muted/40"
                          )}
                          htmlFor={`delivery-mode-${option.value}`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-md border",
                                isActive
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border/70 bg-muted/60 text-muted-foreground"
                              )}
                            >
                              <HugeiconsIcon
                                className="size-4"
                                icon={option.icon}
                              />
                            </span>
                            <div className="space-y-1">
                              <p className="font-medium text-sm leading-tight">
                                {option.label}
                              </p>
                              <p className="text-muted-foreground text-xs leading-tight">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              <Separator className="bg-border/50" />

              <div
                className={cn(
                  "space-y-4 rounded-lg border border-border/70 bg-background/75 p-4",
                  {
                    hidden: reportType === "inventory",
                  }
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-xs ring-1 ring-primary/20">
                    4
                  </span>
                  <HugeiconsIcon
                    className="size-4 text-muted-foreground"
                    icon={FilterIcon}
                  />
                  <p className="font-medium text-sm">
                    {t("generated.admin.reports.builder.filters")}
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {reportType === "temperature" && (
                    <motion.div
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                      exit={{ opacity: 0, height: 0 }}
                      initial={{ opacity: 0, height: 0 }}
                      key="temperature-dates"
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>
                            {t("generated.admin.reports.builder.fromDate")}
                          </Label>
                          <DatePicker
                            date={startDate ? new Date(startDate) : undefined}
                            onDateChange={setStartDate}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            {t("generated.admin.reports.builder.toDate")}
                          </Label>
                          <DatePicker
                            date={endDate ? new Date(endDate) : undefined}
                            onDateChange={setEndDate}
                            setTimeToEndOfDay
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {reportType === "expiry" && (
                    <motion.div
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                      exit={{ opacity: 0, height: 0 }}
                      initial={{ opacity: 0, height: 0 }}
                      key="expiry-window"
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="expiry-window">
                          {t("generated.admin.reports.builder.daysUntilExpiry")}
                        </Label>
                        <Input
                          id="expiry-window"
                          min={1}
                          onChange={(event) => {
                            setExpiryWindowDays(event.target.value)
                          }}
                          type="number"
                          value={expiryWindowDays}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {reportType === "temperature" && (
                    <motion.div
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                      exit={{ opacity: 0, height: 0 }}
                      initial={{ opacity: 0, height: 0 }}
                      key="temperature-severity"
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="temperature-severity">
                          {t("generated.admin.reports.columns.level")}
                        </Label>
                        <Select
                          onValueChange={(value) => {
                            setTemperatureSeverity(value as TemperatureSeverity)
                          }}
                          value={temperatureSeverity}
                        >
                          <SelectTrigger
                            className="w-full"
                            id="temperature-severity"
                          >
                            <SelectValue
                              render={
                                <span>
                                  {temperatureSeverityLabels[
                                    temperatureSeverity
                                  ] ??
                                    t(
                                      "generated.admin.reports.builder.selectSeverity"
                                    )}
                                </span>
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">
                              {t("generated.admin.reports.builder.severityAll")}
                            </SelectItem>
                            <SelectItem value="WARNING">
                              {t(
                                "generated.admin.reports.builder.severityWarningAndCritical"
                              )}
                            </SelectItem>
                            <SelectItem value="CRITICAL">
                              {t(
                                "generated.admin.reports.builder.severityCriticalOnly"
                              )}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>

            <CardFooter className="border-border/70 border-t">
              <Button
                className="ml-auto"
                data-icon="inline-start"
                isLoading={isGenerating}
                onClick={handleGenerateReport}
                type="button"
              >
                <HugeiconsIcon className="size-4" icon={FileDownloadIcon} />
                {t("generated.admin.reports.builder.generateReport")}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        >
          <Card className="relative overflow-hidden border border-border/60 bg-card/95">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary/60 via-primary/30 to-primary/5" />
            <CardHeader className="border-border/70 border-b">
              <CardTitle className="text-lg">
                {t("generated.admin.reports.builder.selectionPreviewTitle")}
              </CardTitle>
              <CardDescription>
                {t(
                  "generated.admin.reports.builder.selectionPreviewDescription"
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    className="size-3.5 text-muted-foreground"
                    icon={PackageIcon}
                  />
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    {t("generated.admin.reports.builder.summaryReportType")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {selectedReport && (
                      <HugeiconsIcon
                        className="mr-1.5 size-3"
                        icon={selectedReport.icon}
                      />
                    )}
                    {selectedReport?.label}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="grid gap-2">
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    className="size-3.5 text-muted-foreground"
                    icon={Xls01Icon}
                  />
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    {t("generated.admin.reports.builder.summaryOutputFormat")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {selectedFormat && (
                      <HugeiconsIcon
                        className="mr-1.5 size-3"
                        icon={selectedFormat.icon}
                      />
                    )}
                    {selectedFormat?.label}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="grid gap-2">
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    className="size-3.5 text-muted-foreground"
                    icon={Mail01Icon}
                  />
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    {t("generated.admin.reports.builder.summaryDeliveryMethod")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {selectedDeliveryOption && (
                      <HugeiconsIcon
                        className="mr-1.5 size-3"
                        icon={selectedDeliveryOption.icon}
                      />
                    )}
                    {selectedDeliveryOption?.label}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="grid gap-2">
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    className="size-3.5 text-muted-foreground"
                    icon={FilterIcon}
                  />
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    {t("generated.admin.reports.builder.summaryActiveFilters")}
                  </p>
                </div>

                <div className="space-y-2 rounded-md border border-border/80 border-dashed p-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">
                      {t("generated.admin.reports.builder.summaryWarehouse")}
                    </span>{" "}
                    {warehouseName ??
                      t("generated.admin.reports.builder.summaryAllWarehouses")}
                  </p>

                  {reportType === "expiry" && (
                    <p>
                      <span className="text-muted-foreground">
                        {t(
                          "generated.admin.reports.builder.summaryExpiryWindow"
                        )}
                      </span>{" "}
                      {t("generated.admin.reports.builder.daysCount", {
                        value0: Number(expiryWindowDays),
                      })}
                    </p>
                  )}

                  {reportType === "temperature" && (
                    <>
                      <p>
                        <span className="text-muted-foreground">
                          {t(
                            "generated.admin.reports.builder.summaryDateRange"
                          )}
                        </span>{" "}
                        {startDate
                          ? new Date(startDate).toLocaleDateString()
                          : t(
                              "generated.admin.reports.builder.summaryAny"
                            )}{" "}
                        -{" "}
                        {endDate
                          ? new Date(endDate).toLocaleDateString()
                          : t("generated.admin.reports.builder.summaryAny")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          {t("generated.admin.reports.builder.summarySeverity")}
                        </span>{" "}
                        {temperatureSeverityLabels[temperatureSeverity]}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
