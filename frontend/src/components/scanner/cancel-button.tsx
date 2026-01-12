import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "../ui/button"

interface CancelButtonProps {
  onClick: () => void
}

export function CancelButton({ onClick }: CancelButtonProps) {
  return (
    <Button
      className="absolute top-0 right-0"
      onClick={onClick}
      size="icon"
      type="button"
      variant="outline"
    >
      <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
    </Button>
  )
}
