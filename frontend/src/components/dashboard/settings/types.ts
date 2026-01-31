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
  | "VERIFYING"
  | "VERIFIED"
  | "ERROR"

export interface SettingsUser {
  id: number
  email: string
  fullName?: string | null
  role: AccountRole
  status: AccountStatus
}

export interface SettingsContentProps {
  user: SettingsUser
}

export interface ProfileDetail {
  label: string
  value: string
}

export interface TwoFactorChallenge {
  sessionId: string
  secret: string
  destination: string
  issuedAt: string
}

export interface PasswordChallenge {
  sessionId: string
  destination: string
}
