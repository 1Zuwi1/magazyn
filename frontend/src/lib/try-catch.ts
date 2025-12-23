export default async function tryCatch<T, E = Error>(
  promise: Promise<T> | (() => T)
): Promise<[E, undefined] | [undefined, T]> {
  try {
    const data = typeof promise === "function" ? await promise() : await promise
    return [undefined, data]
  } catch (e) {
    return [e as E, undefined]
  }
}
