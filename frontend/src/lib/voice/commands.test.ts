import { beforeEach, describe, expect, it } from "vitest"

import { matchVoiceCommand, normalizeTranscript } from "./commands"

describe("voice commands", () => {
  beforeEach(() => {
    document.documentElement.lang = "pl"
  })

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

  it("matches settings by keyword in longer sentence", () => {
    const match = matchVoiceCommand("Przejdź proszę do ustawień konta")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("settings")
  })

  it("matches add item command", () => {
    const match = matchVoiceCommand("Dodaj produkt")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("add-item")
  })

  it("matches search product command", () => {
    const match = matchVoiceCommand("Znajdź produkt Mleko")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-product")
    expect(match?.params.itemName).toBe("Mleko")
  })

  it("matches gdzie jest synonym for search", () => {
    const match = matchVoiceCommand("Gdzie jest Cukier")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-product")
    expect(match?.params.itemName).toBe("Cukier")
  })

  it("matches wyszukaj synonym for search", () => {
    const match = matchVoiceCommand("Wyszukaj produkt Sok pomarańczowy")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-product")
    expect(match?.params.itemName).toBe("Sok pomaranczowy")
  })

  it("matches assortment synonym for search", () => {
    const match = matchVoiceCommand("Wyszukaj asortyment Czekolada Gorzka")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-assortment")
    expect(match?.params.itemName).toBe("Czekolada Gorzka")
  })

  it("matches szukaj asortymentu synonym for search", () => {
    const match = matchVoiceCommand("Szukaj asortymentu Kod 123")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-assortment")
    expect(match?.params.itemName).toBe("Kod 123")
  })

  it("removes spaces from numeric assortment code", () => {
    const match = matchVoiceCommand("Wyszukaj asortyment 01 23 4567")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-assortment")
    expect(match?.params.itemName).toBe("01234567")
  })

  it("matches notifications command", () => {
    const match = matchVoiceCommand("Pokaż powiadomienia")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("notifications")
  })

  it("matches notifications by keyword in longer sentence", () => {
    const match = matchVoiceCommand("Chcę zobaczyć moje powiadomienia")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("notifications")
  })

  it("matches alerty command", () => {
    const match = matchVoiceCommand("Alerty")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("alerts")
  })

  it("matches extended notifications command synonym", () => {
    const match = matchVoiceCommand("Otwórz centrum powiadomień")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("notifications")
  })

  it("matches admin panel command", () => {
    const match = matchVoiceCommand("Otwórz panel administracyjny")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("admin-panel")
  })

  it("matches admin panel by admin keyword", () => {
    const match = matchVoiceCommand("Przenieś mnie do admin")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("admin-panel")
  })

  it("matches inventory check for specific rack", () => {
    const match = matchVoiceCommand("Sprawdź stan magazynu A1")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("inventory-check")
    expect(match?.params.warehouseName).toBe("A1")
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
    expect(match?.command.id).toBe("search-product")
    expect(match?.params.itemName).toBe("Mleko")
  })

  it("still matches short pattern with real item name", () => {
    const match = matchVoiceCommand("Znajdź Mleko")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-product")
    expect(match?.params.itemName).toBe("Mleko")
  })

  it("matches warehouse command in english locale", () => {
    document.documentElement.lang = "en"

    const match = matchVoiceCommand("Show warehouse A3")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("warehouses:id")
    expect(match?.params.warehouseName).toBe("A3")
  })

  it("matches product search command in english locale", () => {
    document.documentElement.lang = "en"

    const match = matchVoiceCommand("Find product Milk")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("search-product")
    expect(match?.params.itemName).toBe("Milk")
  })

  it("matches notifications by keyword in english locale", () => {
    document.documentElement.lang = "en"

    const match = matchVoiceCommand("Please open my notifications now")

    expect(match).not.toBeNull()
    expect(match?.command.id).toBe("notifications")
  })

  it("rejects generic english search phrase without a product name", () => {
    document.documentElement.lang = "en"

    const match = matchVoiceCommand("Find product")

    expect(match).toBeNull()
  })

  it("does not match polish commands when english locale is active", () => {
    document.documentElement.lang = "en"

    const match = matchVoiceCommand("Pokaż magazyn A3")

    expect(match).toBeNull()
  })
})
