import { describe, expect, it } from "vitest"

import { matchVoiceCommand, normalizeTranscript } from "./commands"

describe("voice commands", () => {
  it("normalizes transcript with diacritics and spaces", () => {
    expect(normalizeTranscript("  Pokaż   magazyn  A1  ")).toBe(
      "Pokaz magazyn A1"
    )
  })

  it("normalizes empty transcript", () => {
    expect(normalizeTranscript("   ")).toBe("")
  })

  it("normalizes transcript with special characters", () => {
    expect(normalizeTranscript("@@@###!!!")).toBe("")
  })

  it("matches warehouse command case-insensitively", () => {
    const match = matchVoiceCommand("Pokaż magazyn A3")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("warehouses:id")
    expect(match?.params.warehouseName).toBe("A3")
  })

  it("matches warehouse command with spaces in name", () => {
    const match = matchVoiceCommand("pokaz magazyn Magazyn A1")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("warehouses:id")
    expect(match?.params.warehouseName).toBe("Magazyn A1")
  })

  it("matches warehouse command with ID instead of full name", () => {
    const match = matchVoiceCommand("pokaż magazyn A2")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("warehouses:id")
    expect(match?.params.warehouseName).toBe("A2")
  })

  it("matches items command synonyms", () => {
    const match = matchVoiceCommand("Otwórz przedmioty")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("items")
  })

  it("matches warehouse command with alphanumeric suffix", () => {
    const match = matchVoiceCommand("Pokaż magazyn A4A")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("warehouses:id")
    expect(match?.params.warehouseName).toBe("A4A")
  })

  it("returns null for unrelated text", () => {
    const match = matchVoiceCommand("Zrob mi kawe")

    expect(match).toBeNull()
  })

  it("matches scanner open command", () => {
    const match = matchVoiceCommand("Uruchom skaner")
    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("open-scanner")
  })

  it("matches dashboard command", () => {
    const match = matchVoiceCommand("Pokaż dashboard")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("dashboard")
  })

  it("matches settings command", () => {
    const match = matchVoiceCommand("Ustawienia")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("settings")
  })

  it("matches add item command", () => {
    const match = matchVoiceCommand("Dodaj produkt")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("add-item")
  })

  it("matches delete item command", () => {
    const match = matchVoiceCommand("Usuń produkt A12")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("delete-item")
  })
})
