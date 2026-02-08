import type { User } from "@/lib/schemas"

export type AccountRole = "ADMIN" | "USER"
export type AccountStatus =
  | "ACTIVE"
  | "PENDING_VERIFICATION"
  | "DISABLED"
  | "LOCKED"
export type TwoFactorStatus = "DISABLED" | "SETUP" | "ENABLED"
export type TwoFactorSetupStage =
  | "IDLE"
  | "REQUESTING"
  | "SENDING"
  | "AWAITING"
  | "VERIFYING"
  | "SUCCESS"
  | "ERROR"
export type PasswordVerificationStage =
  | "IDLE"
  | "SENDING"
  | "AWAITING"
  | "ERROR"

export interface SettingsContentProps {
  user: User
}

export interface ProfileDetail {
  label: string
  value: string
}

export interface AuthenticatorSetupData {
  secret: string
  accountName: string
  issuer: string
  issuedAt: string
}
