import axios from "axios"
import type { Goal, OperationalGoal, CreateGoalInput, CreateOperationalGoalInput } from "../types/goal.types"

const API_URL = "http://localhost:3000/api/v1"

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
})

export const getGoalsService = async (patientId: string): Promise<Goal[]> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/goals`, {
    headers: getHeaders()
  })
  return response.data.goals
}

export const createGoalService = async (
  patientId: string,
  data: CreateGoalInput
): Promise<Goal> => {
  const response = await axios.post(`${API_URL}/patients/${patientId}/goals`, 
    {
      ...data,
      startDate: data.startDate + "T12:00:00",
      endDate: data.endDate + "T12:00:00"
    },
    { headers: getHeaders() }
  )
  return response.data.goal
}

export const createOperationalGoalService = async (
  patientId: string,
  goalId: string,
  data: CreateOperationalGoalInput
): Promise<OperationalGoal> => {
  const response = await axios.post(
    `${API_URL}/patients/${patientId}/goals/${goalId}/operational`,
    data,
    { headers: getHeaders() }
  )
  return response.data.operationalGoal
}

export const updateOperationalGoalService = async (
  patientId: string,
  operationalId: string,
  completed: boolean,
  status?: string,
  notes?: string
): Promise<OperationalGoal> => {
  const response = await axios.put(
    `${API_URL}/patients/${patientId}/goals/operational/${operationalId}`,
    { completed, status, notes },
    { headers: getHeaders() }
  )
  return response.data.operationalGoal
}