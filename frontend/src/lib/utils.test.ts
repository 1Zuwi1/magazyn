import { describe, expect, it } from "vitest"

import { cn } from "./utils"

describe("cn", () => {
  it("merges class names using clsx and tailwind-merge", () => {
    const result = cn("text-red-500", "bg-blue-500")

    expect(result).toBe("text-red-500 bg-blue-500")
  })

  it("handles conditional classes", () => {
    const result = cn("base-class", "conditional-class", false)

    expect(result).toBe("base-class conditional-class")
  })

  it("handles undefined and null values", () => {
    const result = cn("base-class", undefined, null, "another-class")

    expect(result).toBe("base-class another-class")
  })

  it("merges Tailwind classes correctly - later class wins in single string", () => {
    // When classes are in a single string, tailwind-merge picks the last one
    const result = cn("text-blue-500 text-red-500")

    expect(result).toBe("text-red-500")
  })

  it("handles arrays of classes", () => {
    const result = cn(["class1", "class2"], "class3")

    expect(result).toBe("class1 class2 class3")
  })

  it("handles objects with boolean values", () => {
    const result = cn({
      class1: true,
      class2: false,
      class3: true,
    })

    expect(result).toBe("class1 class3")
  })

  it("handles complex inputs", () => {
    const isActive = true
    const size = "large"
    const result = cn(
      "base-class",
      {
        "active-class": isActive,
        "inactive-class": !isActive,
      },
      size === "large" && "large-class"
    )

    expect(result).toBe("base-class active-class large-class")
  })

  it("handles empty inputs", () => {
    expect(cn()).toBe("")
    expect(cn("")).toBe("")
  })

  it("handles numbers and other falsy values", () => {
    const result = cn("class1", 0, "", false, "class2")

    expect(result).toBe("class1 class2")
  })

  it("merges conflicting Tailwind utility classes", () => {
    // Tailwind-merge should handle conflicts - later class wins
    const result = cn("p-2 p-4")

    expect(result).toBe("p-4")
  })

  it("handles Tailwind classes with arbitrary values", () => {
    const result = cn("text-[14px]", "text-[16px]")

    expect(result).toBe("text-[16px]")
  })

  it("handles responsive variants correctly", () => {
    const result = cn("md:text-red-500", "md:text-blue-500")

    expect(result).toBe("md:text-blue-500")
  })

  it("handles hover and other state variants", () => {
    const result = cn("hover:bg-red-500", "hover:bg-blue-500")

    expect(result).toBe("hover:bg-blue-500")
  })

  it("handles dark mode variants", () => {
    const result = cn("dark:text-white", "dark:text-black")

    expect(result).toBe("dark:text-black")
  })
})
