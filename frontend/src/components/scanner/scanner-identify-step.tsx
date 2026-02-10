"use client"

import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  SearchList01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useState } from "react"
import { translateMessage } from "@/i18n/translate-message"
import type {
  IdentificationCandidate,
  IdentificationResult,
} from "@/lib/schemas"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { ItemPhoto } from "../ui/item-photo"
import { ScrollArea } from "../ui/scroll-area"
import { CancelButton } from "./cancel-button"
import { ScannerBody } from "./scanner-body"

const CONFIDENCE_LABELS: Record<string, string> = {
  HIGH_CONFIDENCE: translateMessage("generated.m1053"),
  MEDIUM_CONFIDENCE: translateMessage("generated.m0736"),
}

const getConfidenceLevelLabel = (level: string): string =>
  CONFIDENCE_LABELS[level] ?? translateMessage("generated.m1054")

interface ScannerIdentifyStepProps {
  result: IdentificationResult
  isAccepting: boolean
  isReporting: boolean
  onAccept: (candidate: IdentificationCandidate) => void
  onMismatch: (rejectedItemId: number) => void
  onCancel: () => void
}

function CandidateCard({
  candidate,
  isSelected,
  onSelect,
}: {
  candidate: IdentificationCandidate
  isSelected: boolean
  onSelect: (candidate: IdentificationCandidate) => void
}) {
  return (
    <button
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card/50 hover:bg-card/80"
      }`}
      onClick={() => onSelect(candidate)}
      type="button"
    >
      <ItemPhoto
        alt={candidate.itemName}
        containerClassName="size-14 shrink-0"
        iconClassName="size-6 text-muted-foreground"
        imageClassName="object-cover"
        src={`/api/items/${candidate.itemId}/photo`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="truncate font-medium text-sm">{candidate.itemName}</h4>
          {candidate.isDangerous ? (
            <Badge className="shrink-0" variant="destructive">
              {translateMessage("generated.m0925")}
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 font-mono text-muted-foreground text-xs">
          {translateMessage("generated.m1100", { value0: candidate.code })}
        </p>
        <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
          <span>
            {translateMessage("generated.m0737")}{" "}
            <span className="font-medium text-foreground">
              {Math.round(candidate.similarityScore * 100)}%
            </span>
          </span>
          <span>
            {translateMessage("generated.m1022")}{" "}
            <span className="font-medium text-foreground">
              {candidate.weight} {translateMessage("generated.m0954")}
            </span>
          </span>
        </div>
      </div>
      {isSelected ? (
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
          <HugeiconsIcon
            className="size-4 text-primary-foreground"
            icon={CheckmarkCircle02Icon}
          />
        </div>
      ) : null}
    </button>
  )
}

export function ScannerIdentifyStep({
  result,
  isAccepting,
  isReporting,
  onAccept,
  onMismatch,
  onCancel,
}: ScannerIdentifyStepProps) {
  const [selectedCandidate, setSelectedCandidate] =
    useState<IdentificationCandidate | null>(
      result.candidates.length > 0 ? result.candidates[0] : null
    )

  const handleAccept = useCallback(() => {
    if (selectedCandidate) {
      onAccept(selectedCandidate)
    }
  }, [selectedCandidate, onAccept])

  const handleMismatch = useCallback(() => {
    if (selectedCandidate) {
      onMismatch(selectedCandidate.itemId)
    }
  }, [selectedCandidate, onMismatch])

  const hasNoCandidates = result.candidates.length === 0

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        <div className="mb-4">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <HugeiconsIcon
                className="size-6 text-primary"
                icon={SearchList01Icon}
              />
            </div>
            <div>
              <h2 className="font-semibold text-xl tracking-tight">
                {translateMessage("generated.m0738")}
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                {result.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                result.confidenceLevel === "HIGH_CONFIDENCE"
                  ? "default"
                  : "secondary"
              }
            >
              {getConfidenceLevelLabel(result.confidenceLevel)}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {translateMessage("generated.m0739", {
                value0: Math.round(result.similarityScore * 100),
              })}
            </span>
          </div>
        </div>

        {hasNoCandidates ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
              <HugeiconsIcon
                className="size-8 text-muted-foreground"
                icon={Cancel01Icon}
              />
            </div>
            <div className="max-w-sm space-y-2">
              <h3 className="font-semibold text-lg">
                {translateMessage("generated.m0740")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {translateMessage("generated.m0741")}
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-2">
              {result.candidates.map((candidate) => (
                <CandidateCard
                  candidate={candidate}
                  isSelected={selectedCandidate?.itemId === candidate.itemId}
                  key={candidate.itemId}
                  onSelect={setSelectedCandidate}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="space-y-2 pt-4">
          {hasNoCandidates ? (
            <Button
              className="h-12 w-full rounded-xl"
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              {translateMessage("generated.m0742")}
            </Button>
          ) : (
            <>
              <Button
                className="h-12 w-full rounded-xl"
                disabled={!selectedCandidate}
                isLoading={isAccepting}
                onClick={handleAccept}
                type="button"
              >
                {translateMessage("generated.m0743")}
              </Button>
              <Button
                className="h-12 w-full rounded-xl"
                disabled={!selectedCandidate}
                isLoading={isReporting}
                onClick={handleMismatch}
                type="button"
                variant="outline"
              >
                {translateMessage("generated.m0744")}
              </Button>
            </>
          )}
        </div>
      </div>
    </ScannerBody>
  )
}
