import { useTranslations } from "next-intl"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  InputOTPStatus,
} from "@/components/ui/input-otp"
import { OTP_LENGTH } from "@/config/constants"
import { sanitizeOtpValue } from "./utils"

interface OtpInputProps {
  id: string
  onChange: (value: string) => void
  value: string
  disabled?: boolean
}

export function OtpInput({ id, onChange, value, disabled }: OtpInputProps) {
  const t = useTranslations()

  const statusId = `${id}-status`
  const halfOtpLength = OTP_LENGTH / 2

  return (
    <InputOTP
      aria-describedby={statusId}
      aria-live="polite"
      autoFocus
      containerClassName="gap-2"
      disabled={disabled}
      id={id}
      maxLength={OTP_LENGTH}
      onChange={(raw) => onChange(sanitizeOtpValue(raw))}
      value={value}
    >
      <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:h-9 *:data-[slot=input-otp-slot]:w-8 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-sm">
        {Array.from({ length: halfOtpLength }).map((_, idx) => (
          <InputOTPSlot
            aria-describedby={statusId}
            aria-label={t("inputOtp.digitAriaLabel", {
              value0: idx + 1,
            })}
            index={idx}
            key={idx}
          />
        ))}
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup className="gap-2 *:data-[slot=input-otp-slot]:h-9 *:data-[slot=input-otp-slot]:w-8 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-sm">
        {Array.from({ length: halfOtpLength }).map((_, idx) => (
          <InputOTPSlot
            aria-describedby={statusId}
            aria-label={t("inputOtp.digitAriaLabel", {
              value0: idx + halfOtpLength + 1,
            })}
            index={idx + halfOtpLength}
            key={idx}
          />
        ))}
      </InputOTPGroup>
      <InputOTPStatus id={statusId} />
    </InputOTP>
  )
}
