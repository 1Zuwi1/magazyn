import { describe, expect, it } from "vitest"
import { z } from "zod"

import { createApiSchema } from "./create-api-schema"

describe("createApiSchema", () => {
  it("creates schema with GET output only", () => {
    const UserSchema = z.object({
      id: z.number(),
      name: z.string(),
    })

    const schema = createApiSchema({
      GET: { output: UserSchema },
    })

    expect(schema.shape.GET).toBeDefined()
    expect(schema.shape.GET?.shape.output).toBe(UserSchema)
  })

  it("creates schema with POST input and output", () => {
    const inputSchema = z.object({
      email: z.email(),
      password: z.string(),
    })
    const outputSchema = z.object({
      success: z.boolean(),
    })

    const schema = createApiSchema({
      POST: { input: inputSchema, output: outputSchema },
    })

    expect(schema.shape.POST).toBeDefined()
    expect(schema.shape.POST?.shape.input).toBe(inputSchema)
    expect(schema.shape.POST?.shape.output).toBe(outputSchema)
  })

  it("creates schema with multiple methods", () => {
    const getItemSchema = z.object({ id: z.number() })
    const createItemSchema = z.object({ name: z.string() })
    const updateItemSchema = z.object({
      id: z.number(),
      name: z.string(),
    })
    const deleteSchema = z.null()

    const schema = createApiSchema({
      GET: { output: getItemSchema },
      POST: { input: createItemSchema, output: getItemSchema },
      PATCH: { input: updateItemSchema, output: getItemSchema },
      DELETE: { output: deleteSchema },
    })

    expect(schema.shape.GET).toBeDefined()
    expect(schema.shape.POST).toBeDefined()
    expect(schema.shape.PATCH).toBeDefined()
    expect(schema.shape.DELETE).toBeDefined()
  })

  it("creates schema with all supported HTTP methods", () => {
    const outputSchema = z.object({ success: z.boolean() })
    const inputSchema = z.object({ data: z.string() })

    const schema = createApiSchema({
      GET: { output: outputSchema },
      POST: { input: inputSchema, output: outputSchema },
      PUT: { input: inputSchema, output: outputSchema },
      PATCH: { input: inputSchema, output: outputSchema },
      DELETE: { output: outputSchema },
    })

    expect(Object.keys(schema.shape)).toEqual(
      expect.arrayContaining(["GET", "POST", "PUT", "PATCH", "DELETE"])
    )
  })

  it("throws error for unsupported HTTP method", () => {
    expect(() => {
      createApiSchema({
        // @ts-expect-error - Testing invalid method
        INVALID: { output: z.object({}) },
      })
    }).toThrow('Unsupported API method "INVALID" passed to createApiSchema')
  })

  it("skips undefined method definitions", () => {
    const outputSchema = z.object({ success: z.boolean() })

    const schema = createApiSchema({
      GET: { output: outputSchema },
      POST: undefined,
      PUT: undefined,
    })

    expect(schema.shape.GET).toBeDefined()
    expect(schema.shape.POST).toBeUndefined()
    expect(schema.shape.PUT).toBeUndefined()
  })

  it("creates valid Zod object schema", () => {
    const outputSchema = z.object({ data: z.string() })

    const schema = createApiSchema({
      GET: { output: outputSchema },
    })

    // Verify it's a proper Zod object
    expect(schema).toBeInstanceOf(z.ZodObject)

    // Verify the shape is correct
    expect(schema.shape.GET).toBeDefined()
    expect(schema.shape.GET?.shape.output).toBe(outputSchema)
  })

  it("handles complex nested schemas", () => {
    const addressSchema = z.object({
      street: z.string(),
      city: z.string(),
      country: z.string(),
    })

    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
      address: addressSchema,
    })

    const schema = createApiSchema({
      GET: { output: userSchema },
    })

    expect(schema.shape.GET?.shape.output).toBe(userSchema)
  })

  it("handles optional and nullable fields in schemas", () => {
    const outputSchema = z.object({
      id: z.number(),
      name: z.string(),
      nickname: z.string().optional(),
      bio: z.string().nullable(),
    })

    const schema = createApiSchema({
      GET: { output: outputSchema },
    })

    expect(schema.shape.GET?.shape.output).toBe(outputSchema)
  })

  it("handles discriminated unions in schemas", () => {
    const successSchema = z.object({
      status: z.literal("success"),
      data: z.string(),
    })

    const errorSchema = z.object({
      status: z.literal("error"),
      message: z.string(),
    })

    const responseSchema = z.discriminatedUnion("status", [
      successSchema,
      errorSchema,
    ])

    const schema = createApiSchema({
      POST: {
        input: z.object({ action: z.string() }),
        output: responseSchema,
      },
    })

    expect(schema.shape.POST?.shape.output).toBe(responseSchema)
  })

  it("handles array and transform schemas", () => {
    const itemSchema = z.object({
      id: z.number(),
      name: z.string(),
    })

    const listSchema = z.array(itemSchema)

    const schema = createApiSchema({
      GET: { output: listSchema },
    })

    expect(schema.shape.GET?.shape.output).toBe(listSchema)
  })
})
