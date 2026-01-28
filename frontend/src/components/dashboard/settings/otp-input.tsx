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
      autoFocus
      containerClassName="gap-2"
      disabled={disabled}
      id={id}
      maxLength={OTP_LENGTH}
      onChange={(raw) => onChange(sanitizeOtpValue(raw))}
      value={value}
    >
      <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:h-9 *:data-[slot=input-otp-slot]:w-8 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-sm">
        {Array.from({ length: OTP_LENGTH / 2 }).map((_, idx) => (
          <InputOTPSlot
            aria-label={`Cyfra ${idx + 1} kodu`}
            index={idx}
            key={idx}
          />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:h-9 *:data-[slot=input-otp-slot]:w-8 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-sm">
        {Array.from({ length: OTP_LENGTH / 2 }).map((_, idx) => (
          <InputOTPSlot
            aria-label={`Cyfra ${idx + OTP_LENGTH / 2 + 1} kodu`}
            index={idx + OTP_LENGTH / 2}
            key={idx}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
