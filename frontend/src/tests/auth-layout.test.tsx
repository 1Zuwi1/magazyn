import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import AuthLayout from "../app/(auth)/layout"

describe("AuthLayout", () => {
  it("renders children inside the layout", () => {
    render(
      <AuthLayout>
        <span>Auth content</span>
      </AuthLayout>
    )

    expect(screen.getByText("Auth content")).toBeInTheDocument()
  })
})
