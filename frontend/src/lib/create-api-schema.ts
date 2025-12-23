import { z } from "zod"
import type { ApiMethod, ApiMethodSchema, ApiSchema } from "./fetcher"

// Example:
// const schema = createApiSchema({
// 	GET: { output: z.object({ ... }) },
// 	POST: { input: z.object({ ... }), output: z.object({ ... }) },
// })

type MethodConfig =
  | { output: z.ZodTypeAny }
  | { input: z.ZodTypeAny; output: z.ZodTypeAny }

type ApiSchemaConfig = Partial<Record<ApiMethod, MethodConfig>>

type ShapeFromConfig<C extends ApiSchemaConfig> = {
  [K in keyof C]-?: C[K] extends {
    input: infer I extends z.ZodTypeAny
    output: infer O extends z.ZodTypeAny
  }
    ? z.ZodObject<{ input: I; output: O }>
    : C[K] extends { output: infer O extends z.ZodTypeAny }
      ? z.ZodObject<{ output: O }>
      : never
}

type SchemaFromConfig<C extends ApiSchemaConfig> = z.ZodObject<
  ShapeFromConfig<C>
> &
  ApiSchema

const VALID_METHODS: ApiMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"]

export const createApiSchema = <const C extends ApiSchemaConfig>(
  config: C
): SchemaFromConfig<C> => {
  const shape: Partial<Record<ApiMethod, ApiMethodSchema>> = {}

  for (const [method, definition] of Object.entries(config)) {
    if (!VALID_METHODS.includes(method as ApiMethod)) {
      throw new Error(
        `Unsupported API method "${method}" passed to createApiSchema`
      )
    }

    if (!definition) {
      continue
    }

    const methodShape: ApiMethodSchema["shape"] = {
      output: definition.output,
    }

    if ("input" in definition) {
      methodShape.input = definition.input
    }

    shape[method as ApiMethod] = z.object(methodShape)
  }

  return z.object(shape) as SchemaFromConfig<C>
}

export type { ApiSchemaConfig, MethodConfig }
