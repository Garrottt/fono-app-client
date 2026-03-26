import axios from "axios"
import type { Task, CreateTaskInput } from "../types/task.types"

const API_URL = "http://localhost:3000/api/v1"

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
})

export const getTasksService = async (patientId: string): Promise<Task[]> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/tasks`, {
    headers: getHeaders()
  })
  return response.data.tasks
}

export const createTaskService = async (
  patientId: string,
  data: CreateTaskInput
): Promise<Task> => {
  const response = await axios.post(`${API_URL}/patients/${patientId}/tasks`, data, {
    headers: getHeaders()
  })
  return response.data.task
}

export const deleteTaskService = async (
  patientId: string,
  taskId: string
): Promise<void> => {
  await axios.delete(`${API_URL}/patients/${patientId}/tasks/${taskId}`, {
    headers: getHeaders()
  })
}