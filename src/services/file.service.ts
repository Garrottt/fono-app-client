import axios from "axios"
import type { FileRecord } from "../types/file.types"

const API_URL = "http://localhost:3000/api/v1"

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
})

export const getFilesService = async (patientId: string): Promise<FileRecord[]> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/files`, {
    headers: getHeaders()
  })
  return response.data.files
}

export const uploadFileService = async (
  patientId: string,
  file: File
): Promise<FileRecord> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await axios.post(`${API_URL}/patients/${patientId}/files`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "multipart/form-data"
    }
  })
  return response.data.file
}

export const deleteFileService = async (
  patientId: string,
  fileId: string
): Promise<void> => {
  await axios.delete(`${API_URL}/patients/${patientId}/files/${fileId}`, {
    headers: getHeaders()
  })
}