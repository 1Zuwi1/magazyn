import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Input } from "@/components/ui/input"

export default function Toolbar() {
  //TODO: implement toolbar
  return <div />
}

interface ToolbarSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function _ToolbarSearch({
  value,
  onChange,
  placeholder = "Szukaj...",
}: ToolbarSearchProps) {
  return (
    <div className="relative">
      <HugeiconsIcon icon={Search01Icon} />
      <Input
        className="w-64 pl-9"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  )
}
