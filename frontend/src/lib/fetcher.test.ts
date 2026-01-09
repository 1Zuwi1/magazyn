import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { apiFetch, FetchError } from "./fetcher"

describe("apiFetch", () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
    vi.useFakeTimers()
  })

  afterEach(() => {
    mockFetch.mockReset()
    vi.useRealTimers()
  })

  describe("GET requests", () => {
    it("fetches data with GET method and validates with schema", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({
            id: z.number(),
            name: z.string(),
          }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { id: 1, name: "Test" },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const result = await apiFetch("/api/test", schema)

      expect(result).toEqual({ id: 1, name: "Test" })
      const fetchCall = mockFetch.mock.calls[0]
      expect(fetchCall[0]).toBe("/api/test")
      expect(fetchCall[1]?.method).toBe("GET")

      const headers = fetchCall[1]?.headers
      expect(headers).toBeInstanceOf(Headers)
      expect(headers?.get("Content-Type")).toBe("application/json")
      expect(headers?.get("Accept")).toBe("application/json")
    })

    it("rejects GET with body parameter", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      await expect(
        apiFetch("/api/test", schema, {
          // biome-ignore lint/suspicious/noTsIgnore: testing
          // @ts-ignore - Testing invalid method with body parameter
          method: "GET",
          // biome-ignore lint/suspicious/noTsIgnore: testing
          // @ts-ignore - Testing invalid body with GET
          body: { data: "test" },
        })
      ).rejects.toThrow(FetchError)
    })

    it("rejects GET with formData parameter", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      await expect(
        // biome-ignore lint/suspicious/noTsIgnore: testing
        // @ts-ignore - Testing invalid formData with GET
        apiFetch("/api/test", schema, {
          method: "GET",
          body: {
            data: "test",
          },
          // biome-ignore lint/suspicious/noTsIgnore: testing
          // @ts-ignore - Testing invalid formData with GET
          formData: (fd, data) => {
            fd.append("data", data.data)
            return fd
          },
        })
      ).rejects.toThrow(FetchError)
    })
  })

  describe("POST requests", () => {
    it("sends POST request with body", async () => {
      const schema = z.object({
        POST: z.object({
          input: z.object({
            email: z.string(),
            password: z.string(),
          }),
          output: z.object({
            success: z.boolean(),
          }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { success: true },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      })

      const result = await apiFetch("/api/login", schema, {
        method: "POST",
        body: {
          email: "test@example.com",
          password: "password123",
        },
      })

      expect(result).toEqual({ success: true })
    })
  })

  describe("PUT requests", () => {
    it("sends PUT request with body", async () => {
      const schema = z.object({
        PUT: z.object({
          input: z.object({ id: z.number(), name: z.string() }),
          output: z.object({ updated: z.boolean() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { updated: true },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const result = await apiFetch("/api/items/1", schema, {
        method: "PUT",
        body: { id: 1, name: "Updated" },
      })

      expect(result).toEqual({ updated: true })
    })

    it("requires body for PUT request", async () => {
      const schema = z.object({
        PUT: z.object({
          input: z.object({ name: z.string() }),
          output: z.object({ updated: z.boolean() }),
        }),
      })

      await expect(
        // @ts-expect-error - Testing missing body
        apiFetch("/api/items/1", schema, { method: "PUT" })
      ).rejects.toThrow("PUT requires body")
    })
  })

  describe("PATCH requests", () => {
    it("sends PATCH request with body", async () => {
      const schema = z.object({
        PATCH: z.object({
          input: z.object({ name: z.string() }),
          output: z.object({ updated: z.boolean() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { updated: true },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const result = await apiFetch("/api/items/1", schema, {
        method: "PATCH",
        body: { name: "Updated" },
      })

      expect(result).toEqual({ updated: true })
    })
  })

  describe("DELETE requests", () => {
    it("sends DELETE request without body", async () => {
      const schema = z.object({
        DELETE: z.object({
          output: z.object({ deleted: z.boolean() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { deleted: true },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const result = await apiFetch("/api/items/1", schema, {
        method: "DELETE",
      })

      expect(result).toEqual({ deleted: true })
    })

    it("sends DELETE request with body", async () => {
      const schema = z.object({
        DELETE: z.object({
          input: z.object({ confirm: z.boolean() }),
          output: z.object({ deleted: z.boolean() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { deleted: true },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const result = await apiFetch("/api/items/1", schema, {
        method: "DELETE",
        body: { confirm: true },
      })

      expect(result).toEqual({ deleted: true })
    })
  })

  describe("Error handling", () => {
    it("throws FetchError when response is not ok", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ message: "Resource not found" }),
      })

      await expect(apiFetch("/api/test", schema)).rejects.toThrow(FetchError)
    })

    it("throws FetchError with custom message from server", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      const errorMessage = "Custom error message"
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        clone: () => ({
          json: async () => ({ message: errorMessage }),
        }),
        json: async () => ({ message: errorMessage }),
      })

      await expect(apiFetch("/api/test", schema)).rejects.toThrow(FetchError)
    })

    it("throws FetchError when JSON parsing fails", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => {
          throw new Error("Invalid JSON")
        },
      })

      await expect(apiFetch("/api/test", schema)).rejects.toThrow(FetchError)
    })

    it("throws FetchError when schema validation fails", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({
            id: z.number(),
            name: z.string(),
          }),
        }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { id: 1 }, // Missing 'name' field
        }),
      })

      await expect(apiFetch("/api/test", schema)).rejects.toThrow(FetchError)
    })

    it("throws FetchError when server returns success: false", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          message: "Server validation failed",
        }),
      })

      await expect(apiFetch("/api/test", schema)).rejects.toThrow(
        "Server validation failed"
      )
    })

    it("throws FetchError for unsupported HTTP method", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      await expect(
        // @ts-expect-error - Testing invalid method
        apiFetch("/api/test", schema, { method: "INVALID" })
      ).rejects.toThrow("Unsupported HTTP method")
    })

    it("throws FetchError when no schema defined for method", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: 1 } }),
      })

      await expect(
        // @ts-expect-error - Testing undefined method schema
        apiFetch("/api/test", schema, { method: "POST", body: {} })
      ).rejects.toThrow("No schema defined for HTTP method")
    })
  })

  describe("Timeout handling", () => {
    it("passes abort signal to fetch", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: 1 } }),
      })

      await apiFetch("/api/test", schema)

      const fetchCall = mockFetch.mock.calls[0]
      expect(fetchCall[1]?.signal).toBeInstanceOf(AbortSignal)
    })
  })

  describe("FormData handling", () => {
    it("handles FormData with POST request", async () => {
      const schema = z.object({
        POST: z.object({
          input: z.object({ file: z.any() }),
          output: z.object({ uploaded: z.boolean() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { uploaded: true },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const formDataHandler = vi.fn()

      await apiFetch("/api/upload", schema, {
        method: "POST",
        body: { file: "test.txt" },
        formData: formDataHandler,
      })

      expect(formDataHandler).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/upload",
        expect.not.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      )
    })
  })

  describe("Header merging", () => {
    it("merges custom headers with defaults", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { id: 1 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      await apiFetch("/api/test", schema, {
        headers: {
          "X-Custom-Header": "custom-value",
        },
      })

      const fetchCall = mockFetch.mock.calls[0]
      const headers = fetchCall[1]?.headers
      expect(headers).toBeInstanceOf(Headers)
      expect(headers?.get("X-Custom-Header")).toBe("custom-value")
      expect(headers?.get("Content-Type")).toBe("application/json")
      expect(headers?.get("Accept")).toBe("application/json")
    })

    it("does not override existing Content-Type with FormData", async () => {
      const schema = z.object({
        POST: z.object({
          input: z.object({ data: z.string() }),
          output: z.object({ success: z.boolean() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { success: true },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      await apiFetch("/api/test", schema, {
        method: "POST",
        body: { data: "test" },
        formData: (formData) => {
          expect(formData).toBeInstanceOf(FormData)
        },
      })

      const fetchCall = mockFetch.mock.calls[0]
      expect(fetchCall[1]?.headers).not.toHaveProperty("Content-Type")
    })
  })

  describe("Credentials", () => {
    it("defaults to include credentials", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { id: 1 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      await apiFetch("/api/test", schema)

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({
          credentials: "include",
        })
      )
    })

    it("respects custom credentials setting", async () => {
      const schema = z.object({
        GET: z.object({
          output: z.object({ id: z.number() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { id: 1 },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      await apiFetch("/api/test", schema, {
        credentials: "same-origin",
      })

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({
          credentials: "same-origin",
        })
      )
    })
  })

  describe("BodyInit types", () => {
    it("handles string body", async () => {
      const schema = z.object({
        POST: z.object({
          input: z.string(),
          output: z.object({ success: z.boolean() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { success: true },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      await apiFetch("/api/test", schema, {
        method: "POST",
        body: "raw string body",
      })

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({
          body: "raw string body",
        })
      )
    })

    it("handles Blob body", async () => {
      const schema = z.object({
        POST: z.object({
          input: z.instanceof(Blob),
          output: z.object({ uploaded: z.boolean() }),
        }),
      })

      const mockResponse = {
        success: true,
        data: { uploaded: true },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

      const blob = new Blob(["test"], { type: "text/plain" })

      await apiFetch("/api/test", schema, {
        method: "POST",
        body: blob,
      })

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({
          body: blob,
        })
      )
    })
  })
})
