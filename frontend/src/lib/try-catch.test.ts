import { describe, expect, it } from "vitest"

import tryCatch from "./try-catch"

describe("tryCatch", () => {
  it("returns [undefined, data] when promise resolves", async () => {
    const data = { foo: "bar" }
    const result = await tryCatch(Promise.resolve(data))

    expect(result).toEqual([undefined, data])
  })

  it("returns [undefined, data] when function returns successfully", async () => {
    const data = { foo: "bar" }
    const result = await tryCatch(() => data)

    expect(result).toEqual([undefined, data])
  })

  it("returns [error, undefined] when promise rejects", async () => {
    const error = new Error("Test error")
    const result = await tryCatch(Promise.reject(error))

    expect(result).toEqual([error, undefined])
  })

  it("returns [error, undefined] when function throws", async () => {
    const error = new Error("Test error")
    const result = await tryCatch(() => {
      throw error
    })

    expect(result).toEqual([error, undefined])
  })

  it("handles async functions", async () => {
    const asyncFn = async () => {
      return await Promise.resolve("async result")
    }
    const result = await tryCatch(asyncFn())

    expect(result).toEqual([undefined, "async result"])
  })

  it("handles throwing async functions", async () => {
    const asyncFn = () => {
      throw new Error("async error")
    }
    const result = await tryCatch(asyncFn)

    expect(result[0]).toBeInstanceOf(Error)
    expect(result[0]?.message).toBe("async error")
    expect(result[1]).toBeUndefined()
  })

  it("preserves error type", async () => {
    class CustomError extends Error {
      code: number
      constructor(message: string, code: number) {
        super(message)
        this.name = "CustomError"
        this.code = code
      }
    }

    const error = new CustomError("Custom error", 404)
    const result = await tryCatch<undefined, CustomError>(Promise.reject(error))

    expect(result[0]).toBeInstanceOf(CustomError)
    expect(result[0]?.code).toBe(404)
  })
})
