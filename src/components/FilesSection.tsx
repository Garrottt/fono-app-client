import { useState, useEffect } from "react"
import type { FileRecord } from "../types/file.types"
import { getFilesService, uploadFileService, deleteFileService } from "../services/file.service"

interface Props {
  patientId: string
}

function FilesSection({ patientId }: Props) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchFiles()
  }, [patientId])

  const fetchFiles = async () => {
    try {
      const data = await getFilesService(patientId)
      setFiles(data)
    } catch (err) {
      setError("Error al cargar los archivos")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError("")

    try {
      const newFile = await uploadFileService(patientId, file)
      setFiles([newFile, ...files])
    } catch (err) {
      setError("Error al subir el archivo. Verificá que sea PDF, Word o imagen y menor a 10MB.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm("¿Estás seguro de eliminar este archivo?")) return

    try {
      await deleteFileService(patientId, fileId)
      setFiles(files.filter(f => f.id !== fileId))
    } catch (err) {
      setError("Error al eliminar el archivo")
    }
  }

  const getFileIcon = (filetype: string) => {
    if (filetype === "application/pdf") return "📄"
    if (filetype.includes("word")) return "📝"
    if (filetype.startsWith("image/")) return "🖼️"
    return "📎"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (loading) return <p className="text-gray-400 text-sm">Cargando archivos...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">Archivos</h3>
        <label
          className={`bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {uploading ? "Subiendo..." : "+ Subir archivo"}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {files.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-400">No hay archivos subidos todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {files.map(file => (
            <div
              key={file.id}
              className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(file.filetype)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{file.filename}</p>
                  <p className="text-xs text-gray-400">
                    Subido el {formatDate(file.uploadedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={"http://localhost:3000" + file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                >
                  Descargar
                </a>

                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FilesSection