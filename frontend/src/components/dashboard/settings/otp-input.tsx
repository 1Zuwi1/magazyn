import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { OTP_LENGTH } from "./constants"
import { sanitizeOtpValue } from "./utils"

interface OtpInputProps {
  id: string
  onChange: (value: string) => void
  value: string
  disabled?: boolean
}

export function OtpInput({ id, onChange, value, disabled }: OtpInputProps) {
  return (
    <InputOTP
      containerClassName="gap-2"
      disabled={disabled}
      id={id}
      maxLength={OTP_LENGTH}
      onChange={(raw) => onChange(sanitizeOtpValue(raw))}
      value={value}
    >
      <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:h-9 *:data-[slot=input-otp-slot]:w-8 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-sm">
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:h-9 *:data-[slot=input-otp-slot]:w-8 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-sm">
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
