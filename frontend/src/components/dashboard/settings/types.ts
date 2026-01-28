export type AccountRole = "admin" | "user"
export type AccountStatus = "verified" | "unverified" | "banned"
export type TwoFactorMethod = "authenticator" | "sms" | "email"
export type TwoFactorStatus = "disabled" | "setup" | "enabled"
export type TwoFactorSetupStage =
  | "idle"
  | "requesting"
  | "sending"
  | "awaiting"
  | "verifying"
  | "success"
  | "error"
export type PasswordVerificationStage =
  | "idle"
  | "sending"
  | "awaiting"
  | "verifying"
  | "verified"
  | "error"

export interface SettingsUser {
  id: number
  email: string
  fullName?: string | null
  role: AccountRole
  status: AccountStatus
  twoFactorEnabled: boolean
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
