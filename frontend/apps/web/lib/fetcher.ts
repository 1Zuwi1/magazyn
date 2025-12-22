import type { output } from "zod";
import { z } from "zod";
import tryCatch from "./tryCatch";

// ----------------- API response schema helpers -----------------

const createApiSchemas = <S extends z.ZodTypeAny>(dataSchema: S) =>
	z.discriminatedUnion("success", [
		z.object({ success: z.literal(true), data: dataSchema }),
		z.object({ success: z.literal(false), message: z.string() }),
	]);

const cachedSchemas = new WeakMap<
	z.ZodTypeAny,
	ReturnType<typeof createApiSchemas>
>();

const getCachedSchema = <S extends z.ZodTypeAny>(dataSchema: S) => {
	if (!cachedSchemas.has(dataSchema)) {
		cachedSchemas.set(dataSchema, createApiSchemas(dataSchema));
	}
	// non-null by construction
	return cachedSchemas.get(dataSchema)!;
};

// ----------------- Public types -----------------

export type ApiError = { success: false; message: string };
export type ApiSuccess<S> = { success: true; data: S };
export type ApiResponse<S> = ApiError | ApiSuccess<S>;

export class FetchError extends Error {
	public status?: number;
	constructor(message: string, status?: number) {
		super(message);
		this.name = "FetchError";
		this.status = status;
	}
}

export type ApiMethodSchema = z.ZodObject<{
	input?: z.ZodTypeAny;
	output: z.ZodTypeAny;
}>;

export type ApiSchema = z.ZodObject<
	Partial<Record<ApiMethod, ApiMethodSchema>>
>;

export type InferApiOutput<S extends ApiSchema, M extends ApiMethod> = output<
	S["shape"][M] extends ApiMethodSchema
		? S["shape"][M]["shape"]["output"]
		: never
>;

export type InferApiInput<
	S extends ApiSchema,
	M extends ApiMethod,
> = S["shape"][M] extends ApiMethodSchema
	? S["shape"][M]["shape"]["input"] extends z.ZodTypeAny
		? output<S["shape"][M]["shape"]["input"]>
		: never
	: never;

// ----------------- Init typing (method-aware) -----------------

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type MethodsWithoutBody = "GET";
type MethodsWithOptionalBody = "DELETE"; // add more if you have such endpoints
type MethodWithBodyRequired = Exclude<
	ApiMethod,
	MethodsWithoutBody | MethodsWithOptionalBody
>;

type FormDataHandler<T> = (formData: FormData, data: T) => void;

type InitGet = Omit<RequestInit, "body"> & {
	method?: MethodsWithoutBody | undefined;
	body?: never;
	formData?: never;
};

type InitWithBodyRequired<
	S extends ApiSchema,
	M extends MethodWithBodyRequired,
> = Omit<RequestInit, "body"> & {
	method: M;
} & (
		| { body: InferApiInput<S, M>; formData?: never }
		| {
				body: InferApiInput<S, M>;
				formData: FormDataHandler<InferApiInput<S, M>>;
		  }
	);

type InitWithBodyOptional<
	S extends ApiSchema,
	M extends MethodsWithOptionalBody,
> = Omit<RequestInit, "body"> & {
	method: M;
} & // no body at all
	(
		| { body?: never; formData?: never }
		// or body present (and therefore optional formData path)
		| { body: InferApiInput<S, M>; formData?: never }
		| {
				body: InferApiInput<S, M>;
				formData: FormDataHandler<InferApiInput<S, M>>;
		  }
	);

// ---- Overloads ----

export async function apiFetch<S extends ApiSchema>(
	path: string,
	dataSchema: S,
	init?: InitGet,
): Promise<InferApiOutput<S, "GET">>;

export async function apiFetch<
	S extends ApiSchema,
	M extends MethodWithBodyRequired,
>(
	path: string,
	dataSchema: S,
	init: InitWithBodyRequired<S, M>,
): Promise<InferApiOutput<S, M>>;

export async function apiFetch<
	S extends ApiSchema,
	M extends MethodsWithOptionalBody,
>(
	path: string,
	dataSchema: S,
	init: InitWithBodyOptional<S, M>,
): Promise<InferApiOutput<S, M>>;
// ---- Implementation ----
export async function apiFetch<S extends ApiSchema, M extends ApiMethod>(
	path: string,
	dataSchema: S,
	// single impl signature keeps it strict without `any`
	init?: Omit<RequestInit, "body"> & {
		method?: string | undefined;
		body?: unknown;
		formData?: unknown;
	},
): Promise<InferApiOutput<S, M>> {
	// Abort after 15s. Yes, the server should be faster. No, it usually isn't.
	const abortController = new AbortController();
	const timeoutId = setTimeout(
		() => abortController.abort("Request timed out"),
		15000,
	);

	try {
		// Normalize and validate method
		const rawMethod = (init?.method ?? "GET").toString().toUpperCase();
		assertMethod(rawMethod);
		const method: ApiMethod = rawMethod;

		// Enforce payload rules at runtime too, in case someone type-asserts past the overloads.
		const hasBody = Object.hasOwn(init ?? {}, "body");
		const hasFormData = Object.hasOwn(init ?? {}, "formData");

		if (method === "GET") {
			if (hasBody) throw new FetchError("GET cannot include body");
			if (hasFormData) throw new FetchError("GET cannot include formData");
		} else if (method === "DELETE") {
			// optional body: allowed with or without body; if formData is present, body must exist
			if (hasFormData && !hasBody)
				throw new FetchError("DELETE with formData requires body");
		} else {
			// required body
			if (!hasBody) throw new FetchError(`${method} requires body`);
		}

		// Build body
		let bodyToSend: BodyInit | undefined;
		if (
			hasFormData &&
			typeof (init as { formData?: unknown }).formData === "function"
		) {
			// formData path
			const fd = new FormData();
			const original = hasBody ? (init as { body: unknown }).body : undefined;
			(init as { formData: FormDataHandler<unknown> }).formData(fd, original);
			bodyToSend = fd;
		} else if (hasBody) {
			// json path: serialize unless it's already a string/Blob/etc.
			const candidate = (init as { body: unknown }).body;
			if (isBodyInit(candidate)) {
				bodyToSend = candidate;
			} else if (typeof candidate === "string") {
				bodyToSend = candidate;
			} else {
				bodyToSend = JSON.stringify(candidate);
			}
		}

		// Clean RequestInit: strip our extensions so they don't leak into fetch
		const {
			formData: _fdHandler,
			body: _ignored,
			...restInit
		} = (init ?? {}) as RequestInit & {
			formData?: unknown;
			body?: unknown;
		};

		const headers: HeadersInit = mergeHeaders(
			restInit.headers,
			bodyToSend instanceof FormData
				? undefined
				: { "Content-Type": "application/json", Accept: "application/json" },
		);

		const res = await fetch(path, {
			...restInit,
			method,
			signal: abortController.signal,
			headers,
			body: bodyToSend,
		});

		// Network/HTTP error handling
		if (!res.ok) {
			// Try to read structured error; if it fails, fall back to status text.
			const [parseErr, errJson] = await tryCatch(res.clone().json());
			if (
				!parseErr &&
				errJson &&
				typeof errJson === "object" &&
				"message" in errJson
			) {
				const msg = String(
					(errJson as { message?: unknown }).message ??
						`Request failed with ${res.status}`,
				);
				throw new FetchError(msg, res.status);
			}
			throw new FetchError(
				res.statusText || `Request failed with ${res.status}`,
				res.status,
			);
		}

		// Parse JSON
		const [err, json] = await tryCatch(res.json());
		if (err)
			throw new FetchError(
				`Failed to parse response from server: ${err.message}`,
				500,
			);

		// Resolve schema for the chosen method
		const methodSchema = dataSchema.shape[method];
		if (!methodSchema) {
			throw new FetchError(`No schema defined for HTTP method: ${method}`, 500);
		}

		const outputSchema = methodSchema.shape.output;
		const parsed = getCachedSchema(outputSchema).parse(json);

		if (parsed.success) {
			// Narrow return by method. The overloads ensure this maps to InferApiOutput<S, M>
			return parsed.data as InferApiOutput<S, M>;
		}

		throw new FetchError(parsed.message, res.status);
	} catch (e) {
		if (e instanceof FetchError) throw e;
		// Do not leak low-level junk. Keep it user-facing and consistent.
		throw new FetchError(
			"Unexpected error during API fetch: Invalid response from server. Please try again later.",
		);
	} finally {
		clearTimeout(timeoutId);
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
		throw new FetchError(`Unsupported HTTP method: ${m}`);
	}
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
	);
}

function isReadableStream(v: unknown): v is ReadableStream {
	return typeof ReadableStream !== "undefined" && v instanceof ReadableStream;
}

function mergeHeaders(
	base: HeadersInit | undefined,
	extra: Record<string, string> | undefined,
): HeadersInit {
	if (!extra) return base ?? {};
	// Normalize into Headers so we can safely set defaults without clobbering
	const h = new Headers(base ?? {});
	for (const [k, val] of Object.entries(extra)) {
		if (!h.has(k)) h.set(k, val);
	}
	return h;
}
