type BackupStatus = "COMPLETED" | "FAILED" | "PENDING"

export interface Backup {
  id: number
  name: string
  createdAt: Date
  status: BackupStatus
}
