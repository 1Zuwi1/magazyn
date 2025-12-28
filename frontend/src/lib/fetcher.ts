import type { output } from "zod"
import { z } from "zod"
import tryCatch from "./try-catch"

// ----------------- API response schema helpers -----------------

const createApiSchemas = <S extends z.ZodTypeAny>(dataSchema: S) =>
  z.discriminatedUnion("success", [
    z.object({ success: z.literal(true), data: dataSchema }),
    z.object({ success: z.literal(false), message: z.string() }),
  ])

const cachedSchemas = new WeakMap<
  z.ZodTypeAny,
  ReturnType<typeof createApiSchemas>
>()

const getCachedSchema = <S extends z.ZodTypeAny>(dataSchema: S) => {
  if (!cachedSchemas.has(dataSchema)) {
    cachedSchemas.set(dataSchema, createApiSchemas(dataSchema))
  }
  // non-null by construction
  // biome-ignore lint/style/noNonNullAssertion: I'm sure it's there
  return cachedSchemas.get(dataSchema)!
}

// ----------------- Public types -----------------

export interface ApiError {
  success: false
  message: string
}
export interface ApiSuccess<S> {
  success: true
  data: S
}
export type ApiResponse<S> = ApiError | ApiSuccess<S>

export class FetchError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = "FetchError"
    this.status = status
  }
}

export type ApiMethodSchema = z.ZodObject<{
  input?: z.ZodTypeAny
  output: z.ZodTypeAny
}>

export type ApiSchema = z.ZodObject<Partial<Record<ApiMethod, ApiMethodSchema>>>

export type InferApiOutput<S extends ApiSchema, M extends ApiMethod> = output<
  S["shape"][M] extends ApiMethodSchema
    ? S["shape"][M]["shape"]["output"]
    : never
>

export type InferApiInput<
  S extends ApiSchema,
  M extends ApiMethod,
> = S["shape"][M] extends ApiMethodSchema
  ? S["shape"][M]["shape"]["input"] extends z.ZodTypeAny
    ? output<S["shape"][M]["shape"]["input"]>
    : never
  : never

// ----------------- Init typing (method-aware) -----------------

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type MethodsWithoutBody = "GET"
type MethodsWithOptionalBody = "DELETE" // add more if you have such endpoints
type MethodWithBodyRequired = Exclude<
  ApiMethod,
  MethodsWithoutBody | MethodsWithOptionalBody
>

type FormDataHandler<T> = (formData: FormData, data: T) => void

type InitGet = Omit<RequestInit, "body"> & {
  method?: MethodsWithoutBody | undefined
  body?: never
  formData?: never
}

type InitWithBodyRequired<
  S extends ApiSchema,
  M extends MethodWithBodyRequired,
> = Omit<RequestInit, "body"> & {
  method: M
} & (
    | { body: InferApiInput<S, M>; formData?: never }
    | {
        body: InferApiInput<S, M>
        formData: FormDataHandler<InferApiInput<S, M>>
      }
  )

type InitWithBodyOptional<
  S extends ApiSchema,
  M extends MethodsWithOptionalBody,
> = Omit<RequestInit, "body"> & {
  method: M
} & ( // no body at all
    | { body?: never; formData?: never }
    // or body present (and therefore optional formData path)
    | { body: InferApiInput<S, M>; formData?: never }
    | {
        body: InferApiInput<S, M>
        formData: FormDataHandler<InferApiInput<S, M>>
      }
  )

// ---- Overloads ----

export async function apiFetch<S extends ApiSchema>(
  path: string,
  dataSchema: S,
  init?: InitGet
): Promise<InferApiOutput<S, "GET">>

export async function apiFetch<
  S extends ApiSchema,
  M extends MethodWithBodyRequired,
>(
  path: string,
  dataSchema: S,
  init: InitWithBodyRequired<S, M>
): Promise<InferApiOutput<S, M>>

export async function apiFetch<
  S extends ApiSchema,
  M extends MethodsWithOptionalBody,
>(
  path: string,
  dataSchema: S,
  init: InitWithBodyOptional<S, M>
): Promise<InferApiOutput<S, M>>
// ---- Implementation ----
export async function apiFetch<S extends ApiSchema, M extends ApiMethod>(
  path: string,
  dataSchema: S,
  // single impl signature keeps it strict without `any`
  init?: Omit<RequestInit, "body"> & {
    method?: string | undefined
    body?: unknown
    formData?: unknown
  }
): Promise<InferApiOutput<S, M>> {
  // Abort after 15s. Yes, the server should be faster. No, it usually isn't.
  const abortController = new AbortController()
  const timeoutId = setTimeout(
    () => abortController.abort("Request timed out"),
    15_000
  )

  try {
    const method = normalizeMethod(init)
    const payloadFlags = getPayloadFlags(init)
    validatePayloadRules(method, payloadFlags)
    const bodyToSend = buildRequestBody(init, payloadFlags)
    const restInit = stripExtendedInit(init)

    const headers: HeadersInit = mergeHeaders(
      restInit.headers,
      bodyToSend instanceof FormData
        ? undefined
        : { "Content-Type": "application/json", Accept: "application/json" }
    )

    const BASE_URL =
      typeof window === "undefined" ? "http://localhost:8080/" : ""

    const res = await fetch(new URL(path, BASE_URL), {
      ...restInit,
      method,
      signal: abortController.signal,
      headers,
      credentials: restInit.credentials ?? "include",
      body: bodyToSend,
    })

    // Network/HTTP error handling
    if (!res.ok) {
      await throwFetchErrorFromResponse(res)
    }

    // Parse JSON
    const [err, json] = await tryCatch(res.json())
    if (err) {
      throw new FetchError(
        `Failed to parse response from server: ${err.message}`,
        500
      )
    }

    // Resolve schema for the chosen method
    const outputSchema = resolveOutputSchema(dataSchema, method)
    const parsed = getCachedSchema(outputSchema).parse(json)

    if (parsed.success) {
      // Narrow return by method. The overloads ensure this maps to InferApiOutput<S, M>
      return parsed.data as InferApiOutput<S, M>
    }

    throw new FetchError(parsed.message, res.status)
  } catch (e) {
    if (e instanceof FetchError) {
      throw e
    }
    // Do not leak low-level junk. Keep it user-facing and consistent.
    throw new FetchError(
      "Unexpected error during API fetch: Invalid response from server. Please try again later."
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

// ----------------- Small utilities (typed, no any) -----------------

function assertMethod(m: string): asserts m is ApiMethod {
  if (
    m !== "GET" &&
    m !== "POST" &&
    m !== "PUT" &&
    m !== "PATCH" &&
    m !== "DELETE"
  ) {
    throw new FetchError(`Unsupported HTTP method: ${m}`)
  }
}

type ExtendedInit = Omit<RequestInit, "body"> & {
  method?: string | undefined
  body?: unknown
  formData?: unknown
}

function normalizeMethod(init?: ExtendedInit): ApiMethod {
  const rawMethod = (init?.method ?? "GET").toString().toUpperCase()
  assertMethod(rawMethod)
  return rawMethod
}

function getPayloadFlags(init?: ExtendedInit): {
  hasBody: boolean
  hasFormData: boolean
} {
  return {
    hasBody: Object.hasOwn(init ?? {}, "body"),
    hasFormData: Object.hasOwn(init ?? {}, "formData"),
  }
}

function validatePayloadRules(
  method: ApiMethod,
  flags: { hasBody: boolean; hasFormData: boolean }
): void {
  if (method === "GET") {
    if (flags.hasBody) {
      throw new FetchError("GET cannot include body")
    }
    if (flags.hasFormData) {
      throw new FetchError("GET cannot include formData")
    }
    return
  }

  if (method === "DELETE") {
    if (flags.hasFormData && !flags.hasBody) {
      throw new FetchError("DELETE with formData requires body")
    }
    return
  }

  if (!flags.hasBody) {
    throw new FetchError(`${method} requires body`)
  }
}

function buildRequestBody(
  init: ExtendedInit | undefined,
  flags: { hasBody: boolean; hasFormData: boolean }
): BodyInit | undefined {
  if (
    flags.hasFormData &&
    typeof (init as { formData?: unknown }).formData === "function"
  ) {
    const fd = new FormData()
    const original = flags.hasBody
      ? (init as { body: unknown }).body
      : undefined
    ;(init as { formData: FormDataHandler<unknown> }).formData(fd, original)
    return fd
  }

  if (!flags.hasBody) {
    return undefined
  }

  const candidate = (init as { body: unknown }).body
  if (isBodyInit(candidate)) {
    return candidate
  }
  if (typeof candidate === "string") {
    return candidate
  }
  return JSON.stringify(candidate)
}

function stripExtendedInit(init?: ExtendedInit): RequestInit {
  const {
    formData: _fdHandler,
    body: _ignored,
    ...restInit
  } = (init ?? {}) as RequestInit & { formData?: unknown; body?: unknown }
  return restInit
}

async function throwFetchErrorFromResponse(res: Response): Promise<never> {
  const [parseErr, errJson] = await tryCatch(res.clone().json())
  if (
    !parseErr &&
    errJson &&
    typeof errJson === "object" &&
    "message" in errJson
  ) {
    const msg = String(
      (errJson as { message?: unknown }).message ??
        `Request failed with ${res.status}`
    )
    throw new FetchError(msg, res.status)
  }
  throw new FetchError(
    res.statusText || `Request failed with ${res.status}`,
    res.status
  )
}

function resolveOutputSchema<S extends ApiSchema>(
  dataSchema: S,
  method: ApiMethod
): z.ZodTypeAny {
  const methodSchema = dataSchema.shape[method]
  if (!methodSchema) {
    throw new FetchError(`No schema defined for HTTP method: ${method}`, 500)
  }
  return methodSchema.shape.output
}

function isBodyInit(v: unknown): v is BodyInit {
  // Narrow common BodyInit types without depending on DOM lib details at the callsite
  return (
    v instanceof Blob ||
    v instanceof ArrayBuffer ||
    v instanceof FormData ||
    v instanceof URLSearchParams ||
    typeof v === "string" ||
    isReadableStream(v)
  )
}

function isReadableStream(v: unknown): v is ReadableStream {
  return typeof ReadableStream !== "undefined" && v instanceof ReadableStream
}

function mergeHeaders(
  base: HeadersInit | undefined,
  extra: Record<string, string> | undefined
): HeadersInit {
  if (!extra) {
    return base ?? {}
  }
  // Normalize into Headers so we can safely set defaults without clobbering
  const h = new Headers(base ?? {})
  for (const [k, val] of Object.entries(extra)) {
    if (!h.has(k)) {
      h.set(k, val)
    }
  }
  return h
}
