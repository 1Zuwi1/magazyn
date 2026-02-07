"use client"

import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Image01Icon,
  SearchList01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useState } from "react"
import type {
  IdentificationCandidate,
  IdentificationResult,
} from "@/lib/schemas"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { CancelButton } from "./cancel-button"
import { ScannerBody } from "./scanner-body"

const CONFIDENCE_LABELS: Record<string, string> = {
  HIGH_CONFIDENCE: "Wysokie dopasowanie",
  MEDIUM_CONFIDENCE: "Średnie dopasowanie",
}

const getConfidenceLevelLabel = (level: string): string =>
  CONFIDENCE_LABELS[level] ?? "Niskie dopasowanie"

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
      {candidate.photoUrl ? (
        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
          {/* biome-ignore lint/performance/noImgElement: img needs authorization */}
          <img
            alt={candidate.itemName}
            className="object-cover"
            height={100}
            // FIXME: Remove in prod
            src={`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/items/${candidate.itemId}/photo`}
            style={{ width: "100%", height: "100%" }}
            width={100}
          />
        </div>
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
          <HugeiconsIcon
            className="size-6 text-muted-foreground"
            icon={Image01Icon}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="truncate font-medium text-sm">{candidate.itemName}</h4>
          {candidate.isDangerous ? (
            <Badge className="shrink-0" variant="destructive">
              Niebezpieczny
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 font-mono text-muted-foreground text-xs">
          Kod: {candidate.code}
        </p>
        <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
          <span>
            Podobieństwo:{" "}
            <span className="font-medium text-foreground">
              {Math.round(candidate.similarityScore * 100)}%
            </span>
          </span>
          <span>
            Waga:{" "}
            <span className="font-medium text-foreground">
              {candidate.weight} kg
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
                Rozpoznany przedmiot
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
              {Math.round(result.similarityScore * 100)}% pewności
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
                Brak pasujących przedmiotów
              </h3>
              <p className="text-muted-foreground text-sm">
                Nie znaleziono przedmiotów pasujących do zdjęcia. Spróbuj
                zeskanować kod lub wprowadzić go ręcznie.
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
              Wróć do skanera
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
                Potwierdź wybór
              </Button>
              <Button
                className="h-12 w-full rounded-xl"
                disabled={!selectedCandidate}
                isLoading={isReporting}
                onClick={handleMismatch}
                type="button"
                variant="outline"
              >
                To nie ten przedmiot
              </Button>
            </>
          )}
        </div>
      </div>
    </ScannerBody>
  )
}
