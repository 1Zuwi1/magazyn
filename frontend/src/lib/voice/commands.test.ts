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

  it("matches search item command", () => {
    const match = matchVoiceCommand("Znajdź produkt Mleko")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-item")
    expect(match?.params.itemName).toBe("Mleko")
  })

  it("matches gdzie jest synonym for search", () => {
    const match = matchVoiceCommand("Gdzie jest Cukier")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-item")
    expect(match?.params.itemName).toBe("Cukier")
  })

  it("matches wyszukaj synonym for search", () => {
    const match = matchVoiceCommand("Wyszukaj produkt Sok pomarańczowy")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-item")
    expect(match?.params.itemName).toBe("Sok pomaranczowy")
  })

  it("matches notifications command", () => {
    const match = matchVoiceCommand("Pokaż powiadomienia")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("notifications")
  })

  it("matches alerty synonym for notifications", () => {
    const match = matchVoiceCommand("Alerty")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("notifications")
  })

  it("matches inventory check for specific rack", () => {
    const match = matchVoiceCommand("Sprawdź stan regału A1")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("inventory-check")
    expect(match?.params.rackName).toBe("A1")
  })

  it("matches inventory check for specific item", () => {
    const match = matchVoiceCommand("Ile jest Mleko")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("inventory-check")
    expect(match?.params.itemName).toBe("Mleko")
  })

  it("matches general inventory check", () => {
    const match = matchVoiceCommand("Sprawdź stan magazynowy")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("inventory-check")
  })

  it("rejects 'znajdź produkt' without actual product name", () => {
    const match = matchVoiceCommand("Znajdź produkt")

    expect(match).toBeNull()
  })

  it("rejects 'wyszukaj produkt' without actual product name", () => {
    const match = matchVoiceCommand("Wyszukaj produkt")

    expect(match).toBeNull()
  })

  it("rejects 'znajdź przedmiot' without actual item name", () => {
    const match = matchVoiceCommand("Znajdź przedmiot")

    expect(match).toBeNull()
  })

  it("rejects 'ile jest produkt' as generic keyword", () => {
    const match = matchVoiceCommand("Ile jest produkt")

    expect(match).toBeNull()
  })

  it("still matches when actual name follows the keyword", () => {
    const match = matchVoiceCommand("Znajdź produkt Mleko")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-item")
    expect(match?.params.itemName).toBe("Mleko")
  })

  it("still matches short pattern with real item name", () => {
    const match = matchVoiceCommand("Znajdź Mleko")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-item")
    expect(match?.params.itemName).toBe("Mleko")
  })
})
