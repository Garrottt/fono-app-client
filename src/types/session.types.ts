import type { FileRecord } from "./file.types"

export interface SessionOperationalObjective {
  id: string
  specificObjectiveId: string
  description: string
  activities: string[]
  order: number
  createdAt: string
  updatedAt: string
}

export interface SessionSpecificObjective {
  id: string
  sessionId: string
  description: string
  order: number
  operationalObjectives: SessionOperationalObjective[]
  createdAt: string
  updatedAt: string
}

export interface SessionTask {
  id: string
  sessionId: string
  title: string
  description?: string
  order: number
  files: FileRecord[]
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  patientId: string
  professionalId: string
  sessionNumber: number
  date: string
  whatWasDone: string
  contentHierarchy: string[]
  hierarchyCriteria: string
  focus: string
  modality: string
  strategies: string
  generalObjective: string
  specificObjectives: SessionSpecificObjective[]
  sessionTasks: SessionTask[]
  createdAt: string
  updatedAt: string
}

export interface SessionOperationalObjectiveInput {
  id?: string
  description: string
  activities?: string[]
  order: number
}

export interface SessionSpecificObjectiveInput {
  id?: string
  description: string
  order: number
  operationalObjectives: SessionOperationalObjectiveInput[]
}

export interface SessionTaskInput {
  id?: string
  title: string
  description?: string
  order: number
  files?: FileRecord[]
}

export interface SessionPlanInput {
  contentHierarchy: string[]
  hierarchyCriteria: string
  focus: string
  modality: string
  strategies: string
  generalObjective: string
  specificObjectives: SessionSpecificObjectiveInput[]
  sessionTasks: SessionTaskInput[]
}

export interface CreateSessionInput extends SessionPlanInput {
  date: string
  whatWasDone: string
}

export interface UpdateSessionInput extends Partial<CreateSessionInput> {}
