export interface Session {
  id: string
  patientId: string
  date: string
  whatWasDone: string
  createdAt: string
}

export interface CreateSessionInput {
  date: string
  whatWasDone: string
}