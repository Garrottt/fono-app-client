export interface OperationalGoal {
  id: string
  goalId: string
  description: string
  completed: boolean
  status: string
  notes?: string
  order: number
}

export interface Goal {
  id: string
  patientId: string
  description: string
  startDate: string
  endDate: string
  completed: boolean
  operationalGoals: OperationalGoal[]
}

export interface CreateGoalInput {
  description: string
  startDate: string
  endDate: string
}

export interface CreateOperationalGoalInput {
  description: string
  order: number
}