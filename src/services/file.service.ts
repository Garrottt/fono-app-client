import axios from "axios"
import type { FileRecord } from "../types/file.types"
import { API_URL, getAuthHeaders } from "./api"

export const getFilesService = async (patientId: string): Promise<FileRecord[]> => {
  const response = await axios.get(`${API_URL}/patients/${patientId}/files`, {
    headers: getAuthHeaders()
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
      ...getAuthHeaders(),
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
    headers: getAuthHeaders()
  })
}
