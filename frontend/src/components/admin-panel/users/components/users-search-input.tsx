import { Input } from "@/components/ui/input"

interface UsersSearchInputProps {
  value: string
  onChange: (value: string) => void
}

export function UsersSearchInput({ value, onChange }: UsersSearchInputProps) {
  return (
    <div className="border-b bg-muted/30 p-4">
      <Input
        className="max-w-sm"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Szukaj użytkowników..."
        type="search"
        value={value}
      />
    </div>
  )
}
