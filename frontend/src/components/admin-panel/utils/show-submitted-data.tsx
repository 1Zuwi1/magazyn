export function showSubmittedData(data: unknown) {
  return (
    <pre className="mt-2 w-full overflow-x-auto rounded-md bg-slate-950 p-4">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
