import type { output } from "zod"
import { z } from "zod"
import tryCatch from "./try-catch"

// ----------------- API response schema helpers -----------------

const createApiSchemas = <S extends z.ZodType>(dataSchema: S) =>
  z.discriminatedUnion("success", [
    z.object({ success: z.literal(true), data: dataSchema }),
    z.object({ success: z.literal(false), message: z.string() }),
  ])

const cachedSchemas = new WeakMap<
  z.ZodType,
  ReturnType<typeof createApiSchemas>
>()

const getCachedSchema = <S extends z.ZodType>(dataSchema: S) => {
  if (!cachedSchemas.has(dataSchema)) {
    cachedSchemas.set(dataSchema, createApiSchemas(dataSchema))
  }
  // non-null by construction
  // biome-ignore lint/style/noNonNullAssertion: I'm sure it's there
  return cachedSchemas.get(dataSchema)!
}

// ----------------- Public types -----------------

const ERROR_CODE_PATTERN = /^[A-Z0-9_]+$/
const LOCALHOST_BASE_URL = "http://localhost"

const getErrorCodeFromMessage = (message: string): string | undefined =>
  ERROR_CODE_PATTERN.test(message) ? message : undefined

export class FetchError extends Error {
  status?: number
  code?: string
  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = "FetchError"
    this.status = status
    this.code = code ?? getErrorCodeFromMessage(message)
  }

  static isError(err: unknown): err is FetchError {
    return err instanceof FetchError
  }
}

export type ApiMethodSchema = z.ZodObject<{
  input?: z.ZodType
  output: z.ZodType
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
  ? S["shape"][M]["shape"]["input"] extends z.ZodType
    ? output<S["shape"][M]["shape"]["input"]>
    : never
  : never

// ----------------- Init typing (method-aware) -----------------

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
export type ApiResponseType = "json" | "blob"
export const DEFAULT_API_TIMEOUT_MS = 30_000

type MethodsWithoutBody = "GET"
type MethodsWithOptionalBody = "DELETE" // add more if you have such endpoints
type MethodWithBodyRequired = Exclude<
  ApiMethod,
  MethodsWithoutBody | MethodsWithOptionalBody
>

type FormDataHandler<T> = (formData: FormData, data: T) => void

type InitGet<S extends ApiSchema, M extends MethodsWithoutBody> = Omit<
  RequestInit,
  "body"
> & {
  method?: MethodsWithoutBody | undefined
  responseType?: ApiResponseType
  timeoutMs?: number
  body?: never
  formData?: never
  queryParams?: InferApiInput<S, M>
}

type InitWithBodyRequired<
  S extends ApiSchema,
  M extends MethodWithBodyRequired,
> = Omit<RequestInit, "body"> & {
  method: M
  responseType?: ApiResponseType
  timeoutMs?: number
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
  responseType?: ApiResponseType
  timeoutMs?: number
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
  init?: InitGet<S, "GET">
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
    responseType?: ApiResponseType
    timeoutMs?: number
    body?: unknown
    formData?: unknown
  }
): Promise<InferApiOutput<S, M>> {
  const abortController = new AbortController()
  const abort = abortController.abort.bind(abortController)
  const timeoutMs = resolveTimeoutMs(init?.timeoutMs)
  const timeoutId = setTimeout(abort, timeoutMs, "Request timed out")

  try {
    return await performApiFetch(path, dataSchema, init, abortController.signal)
  } catch (e) {
    if (e instanceof FetchError) {
      throw e
    }
    if (process.env.NODE_ENV === "development") {
      console.error("Unexpected error during API fetch:", e)
    }
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
  responseType?: ApiResponseType
  timeoutMs?: number
  body?: unknown
  formData?: unknown
  queryParams?: Record<string, unknown>
}

function resolveTimeoutMs(timeoutMs?: number): number {
  if (timeoutMs === undefined) {
    return DEFAULT_API_TIMEOUT_MS
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new FetchError("timeoutMs must be a positive number", 500)
  }

  return timeoutMs
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
  if (candidate === null) {
    return undefined
  }
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
    queryParams: _queryParams,
    responseType: _responseType,
    timeoutMs: _timeoutMs,
    ...restInit
  } = (init ?? {}) as RequestInit & {
    formData?: unknown
    body?: unknown
    queryParams?: unknown
    responseType?: unknown
    timeoutMs?: unknown
  }
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
): z.ZodType {
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
  extra: HeadersInit | Record<string, string> | undefined
): HeadersInit {
  if (!extra) {
    return base ?? {}
  }
  // Normalize into Headers so we can safely set defaults without clobbering
  const h = new Headers(base ?? {})
  const resolvedExtra = new Headers(extra as HeadersInit)
  for (const [k, val] of resolvedExtra.entries()) {
    if (!h.has(k)) {
      h.set(k, val)
    }
  }
  return h
}

function resolveRequestUrl(path: string, baseUrl?: string): string {
  if (baseUrl) {
    return new URL(path, baseUrl).toString()
  }
  return new URL(path, LOCALHOST_BASE_URL).toString()
}

async function performApiFetch<S extends ApiSchema, M extends ApiMethod>(
  path: string,
  dataSchema: S,
  init: ExtendedInit | undefined,
  signal: AbortSignal
): Promise<InferApiOutput<S, M>> {
  const method = normalizeMethod(init)
  const payloadFlags = getPayloadFlags(init)
  validatePayloadRules(method, payloadFlags)
  const bodyToSend = buildRequestBody(init, payloadFlags)
  const restInit = stripExtendedInit(init)
  const responseType = init?.responseType ?? "json"

  const headersInit: HeadersInit = mergeHeaders(
    restInit.headers,
    bodyToSend instanceof FormData
      ? undefined
      : {
          "Content-Type": "application/json",
          Accept:
            responseType === "blob"
              ? "application/octet-stream"
              : "application/json",
        }
  )

  const url = buildRequestUrl(path, resolveBaseUrl(), method, init?.queryParams)

  const res = await fetch(url, {
    ...restInit,
    method,
    signal,
    headers: await resolveHeaders(headersInit),
    credentials: restInit.credentials ?? "include",
    body: bodyToSend,
  })

  return (await parseResponse(
    res,
    dataSchema,
    method,
    responseType
  )) as InferApiOutput<S, M>
}

function resolveBaseUrl(): string | undefined {
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL
  }

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL
  if (publicApiUrl) {
    return publicApiUrl
  }

  return window.location.origin
}

function buildRequestUrl(
  path: string,
  baseUrl: string | undefined,
  method: ApiMethod,
  queryParams?: Record<string, unknown>
): URL {
  const resolvedPath = resolveRequestUrl(path, baseUrl)
  const url = new URL(resolvedPath)

  if (method !== "GET" || !queryParams) {
    return url
  }

  for (const [key, value] of Object.entries(queryParams)) {
    if (value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item))
      }
    } else {
      url.searchParams.append(key, String(value))
    }
  }

  return url
}

async function resolveHeaders(headersInit: HeadersInit): Promise<HeadersInit> {
  if (typeof window !== "undefined") {
    return headersInit
  }

  return mergeHeaders(
    await (await import("next/headers")).headers(),
    headersInit
  )
}

async function parseResponse<S extends ApiSchema>(
  res: Response,
  dataSchema: S,
  method: ApiMethod,
  responseType: ApiResponseType
): Promise<InferApiOutput<S, ApiMethod>> {
  if (!res.ok) {
    await throwFetchErrorFromResponse(res)
  }

  const outputSchema = resolveOutputSchema(dataSchema, method)

  if (responseType === "blob") {
    const [blobErr, blob] = await tryCatch(res.blob())
    if (blobErr) {
      throw new FetchError(
        `Failed to parse blob response from server: ${blobErr.message}`,
        500
      )
    }

    return outputSchema.parse(blob) as InferApiOutput<S, ApiMethod>
  }

  const [err, json] = await tryCatch(res.json())
  if (err) {
    throw new FetchError(
      `Failed to parse response from server: ${err.message}`,
      500
    )
  }

  const parsed = getCachedSchema(outputSchema).parse(json)

  if (parsed.success) {
    return parsed.data as InferApiOutput<S, ApiMethod>
  }

  throw new FetchError(parsed.message, res.status)
}
