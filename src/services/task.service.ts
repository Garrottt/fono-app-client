import axios from "axios"
import type { Task, CreateTaskInput } from "../types/task.types"
import { API_URL, getAuthHeaders } from "./api"

export const getTasksService = async (patientId: string): Promise<Task[]> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/tasks`, {
    headers: getAuthHeaders()
  })
  return response.data.tasks
}

export const createTaskService = async (
  patientId: string,
  data: CreateTaskInput,
  file?: File
): Promise<Task> => {
  const formData = new FormData()
  formData.append("title", data.title)
  if (data.description) formData.append("description", data.description)
  if (file) formData.append("file", file)

  const response = await axios.post(`${API_URL}/patients/${patientId}/tasks`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data"
    }
  })
  return response.data.task
}

export const deleteTaskService = async (
  patientId: string,
  taskId: string
): Promise<void> => {
  await axios.delete(`${API_URL}/patients/${patientId}/tasks/${taskId}`, {
    headers: getAuthHeaders()
  })
}
export const updateTaskService = async (
  patientId: string,
  taskId: string,
  title: string,
  description?: string,
  file?: File
): Promise<Task> => {
  const formData = new FormData()
  formData.append("title", title)
  if (description) formData.append("description", description)
  if (file) formData.append("file", file)

  const response = await axios.put(
    `${API_URL}/patients/${patientId}/tasks/${taskId}`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data"
      }
    }
  )
  return response.data.task
}
