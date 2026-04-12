export interface PatientPortalUser {
  id: string
  email: string
}

export interface PatientAnamnesisSummary {
  id: string
  updatedAt: string
  hasDiabetesOrImmunosuppression: boolean
  hasPreviousEarSurgeries: boolean
  otorrea: boolean
  otorragia: boolean
}

export interface PatientPreLavadoSummary {
  id: string
  updatedAt: string
  aptoParaLavado: boolean
  precautionAlerts: string[]
  criticalBlocks: string[]
  diagnosticSummary: string
}

export interface Patient {
  id: string
  name: string
  age?: number
  email?: string
  phone?: string
  diagnosis?: string
  active: boolean
  createdAt: string
  user?: PatientPortalUser | null
  anamnesis?: PatientAnamnesisSummary | null
  preLavadoEvaluation?: PatientPreLavadoSummary | null
}

export interface CreatePatientInput {
  name: string
  age?: number
  email?: string
  phone?: string
  diagnosis?: string
}

export interface UpdatePatientInput {
  name?: string
  age?: number
  email?: string
  phone?: string
  diagnosis?: string
}

export interface ConfigurePortalAccessInput {
  email: string
  password: string
}
