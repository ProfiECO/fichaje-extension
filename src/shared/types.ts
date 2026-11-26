export interface AccountConfig {
  domain: string
  usr: string
  pwd: string
}
export interface Preferences {
  dailyHours: number
  weeklyHours: number
}
export interface Checkin {
  name?: string
  log_type: 'IN' | 'OUT' | ''
  time: string
}
export interface Employee {
  name: string
  employee_name: string
}
export interface HrSettings {
  allow_geolocation_tracking?: boolean | 0 | 1
}
export interface Dashboard {
  employee: Employee
  settings: HrSettings
  logs: Checkin[]
  currentLogs: Checkin[]
  last: Checkin | null
  syncedAt: Date
}
export interface Coordinates {
  latitude: number
  longitude: number
}
export interface CheckinDocument extends CoordinatesOptional {
  employee: string
  log_type: 'IN' | 'OUT'
  time: string
}
type CoordinatesOptional = Partial<Coordinates>
