import { useMemo, useState } from "react"
import type { Dispatch, FormEvent, SetStateAction } from "react"
import {
  createSessionService,
  deleteSessionTaskFileService,
  deleteSessionService,
  uploadSessionTaskFileService,
  updateSessionService
} from "../services/session.service"
import { API_URL } from "../services/api"
import type {
  CreateSessionInput,
  Session,
  SessionTask
} from "../types/session.types"

interface SessionsSectionProps {
  patientId: string
  sessions: Session[]
  onSessionsChange: (sessions: Session[]) => void
  onError: (message: string) => void
}

interface SessionFormState extends CreateSessionInput {}

const createOperationalObjective = (description = "") => ({
  description,
  order: 1
})

const createSpecificObjective = (description = "", operationalDescriptions: string[] = [""]) => ({
  description,
  order: 1,
  operationalObjectives: operationalDescriptions.map((item, index) => ({
    ...createOperationalObjective(item),
    order: index + 1
  }))
})

const createTask = (title = "", description = "") => ({
  title,
  description,
  order: 1
})

const createEmptySessionForm = (): SessionFormState => ({
  date: "",
  whatWasDone: "",
  contentHierarchy: [""],
  hierarchyCriteria: "",
  focus: "",
  modality: "",
  strategies: "",
  generalObjective: "",
  specificObjectives: [createSpecificObjective()],
  sessionTasks: [createTask()]
})

const mapSessionToForm = (session: Session): SessionFormState => ({
  date: session.date.split("T")[0],
  whatWasDone: session.whatWasDone,
  contentHierarchy: session.contentHierarchy.length > 0 ? [...session.contentHierarchy] : [""],
  hierarchyCriteria: session.hierarchyCriteria,
  focus: session.focus,
  modality: session.modality,
  strategies: session.strategies,
  generalObjective: session.generalObjective,
  specificObjectives: session.specificObjectives.length > 0
    ? session.specificObjectives.map((specificObjective, specificIndex) => ({
      id: specificObjective.id,
      description: specificObjective.description,
      order: specificIndex + 1,
      operationalObjectives: specificObjective.operationalObjectives.length > 0
        ? specificObjective.operationalObjectives.map((operationalObjective, operationalIndex) => ({
          id: operationalObjective.id,
          description: operationalObjective.description,
          order: operationalIndex + 1
        }))
        : [createOperationalObjective()]
    }))
    : [createSpecificObjective()],
  sessionTasks: session.sessionTasks.length > 0
    ? session.sessionTasks.map((sessionTask, taskIndex) => ({
      id: sessionTask.id,
      title: sessionTask.title,
      description: sessionTask.description || "",
      order: taskIndex + 1
    }))
    : [createTask()]
})

const normalizeSessionForm = (form: SessionFormState): CreateSessionInput => ({
  date: form.date,
  whatWasDone: form.whatWasDone.trim(),
  contentHierarchy: form.contentHierarchy.map((item) => item.trim()),
  hierarchyCriteria: form.hierarchyCriteria.trim(),
  focus: form.focus.trim(),
  modality: form.modality.trim(),
  strategies: form.strategies.trim(),
  generalObjective: form.generalObjective.trim(),
  specificObjectives: form.specificObjectives.map((specificObjective, specificIndex) => ({
    ...specificObjective,
    description: specificObjective.description.trim(),
    order: specificIndex + 1,
    operationalObjectives: specificObjective.operationalObjectives.map((operationalObjective, operationalIndex) => ({
      ...operationalObjective,
      description: operationalObjective.description.trim(),
      order: operationalIndex + 1
    }))
  })),
  sessionTasks: form.sessionTasks.map((sessionTask, taskIndex) => ({
    ...sessionTask,
    title: sessionTask.title.trim(),
    description: sessionTask.description?.trim(),
    order: taskIndex + 1
  }))
})

const getCompletionState = (session: Session) => {
  const hasPlanning =
    session.contentHierarchy.some((item) => item.trim()) &&
    session.hierarchyCriteria.trim() &&
    session.focus.trim() &&
    session.modality.trim() &&
    session.strategies.trim() &&
    session.generalObjective.trim() &&
    session.specificObjectives.length > 0

  if (!hasPlanning) {
    return {
      label: "Incompleta",
      styles: "bg-amber-100 text-amber-700"
    }
  }

  return {
    label: "Planificada",
    styles: "bg-emerald-100 text-emerald-700"
  }
}

const getFileIcon = (filetype: string) => {
  if (filetype === "application/pdf") return "PDF"
  if (filetype.includes("word")) return "WORD"
  if (filetype.startsWith("image/")) return "IMG"
  return "ARCH"
}

interface TaskFilesListProps {
  files: SessionTask["files"]
  getFileIcon: (filetype: string) => string
  getFileUrl: (url: string) => string
  deletingKeyPrefix: string
  uploadingTaskKey: string | null
  onDelete: (fileId: string) => void
}

function TaskFilesList({
  files,
  getFileIcon,
  getFileUrl,
  deletingKeyPrefix,
  uploadingTaskKey,
  onDelete
}: TaskFilesListProps) {
  if (files.length === 0) {
    return <p className="mt-3 text-sm text-slate-500">Todavia no hay archivos para esta indicacion.</p>
  }

  return (
    <div className="mt-3 space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <a
            href={getFileUrl(file.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-3 text-sm text-slate-700 hover:text-indigo-600"
          >
            <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
              {getFileIcon(file.filetype)}
            </span>
            <span className="truncate">{file.filename}</span>
          </a>
          <button
            type="button"
            onClick={() => onDelete(file.id)}
            disabled={uploadingTaskKey === `${deletingKeyPrefix}:${file.id}`}
            className="text-xs font-medium text-rose-500 hover:text-rose-700 disabled:opacity-50"
          >
            {uploadingTaskKey === `${deletingKeyPrefix}:${file.id}` ? "Eliminando..." : "Eliminar archivo"}
          </button>
        </div>
      ))}
    </div>
  )
}

function SessionsSection({ patientId, sessions, onSessionsChange, onError }: SessionsSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(sessions[0]?.id || null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingTaskKey, setUploadingTaskKey] = useState<string | null>(null)
  const [sessionMessage, setSessionMessage] = useState("")
  const [createForm, setCreateForm] = useState<SessionFormState>(createEmptySessionForm())
  const [editForm, setEditForm] = useState<SessionFormState | null>(null)

  const orderedSessions = useMemo(
    () => [...sessions].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
    [sessions]
  )

  const resetCreateForm = () => {
    setCreateForm(createEmptySessionForm())
    setShowCreateForm(false)
  }

  const handleCreateSession = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setSessionMessage("")
    onError("")

    try {
      const payload = normalizeSessionForm(createForm)
      const createdSession = await createSessionService(patientId, payload)
      const nextSessions = [createdSession, ...sessions].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
      )

      onSessionsChange(nextSessions)
      setExpandedSessionId(createdSession.id)
      resetCreateForm()
      setSessionMessage("Sesion guardada correctamente.")
    } catch (error) {
      onError("Error al guardar la sesion. Revisa que la ficha clinica este completa.")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSession = async (sessionId: string) => {
    if (!editForm) return

    setSaving(true)
    setSessionMessage("")
    onError("")

    try {
      const updatedSession = await updateSessionService(patientId, sessionId, normalizeSessionForm(editForm))
      onSessionsChange(
        sessions
          .map((session) => session.id === sessionId ? updatedSession : session)
          .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      )
      setEditingSessionId(null)
      setEditForm(null)
      setSessionMessage(`Sesion ${updatedSession.sessionNumber} actualizada.`)
    } catch (error) {
      onError("Error al actualizar la sesion.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("Esta accion eliminara la sesion y toda su planificacion. Continuar?")) return

    setSaving(true)
    setSessionMessage("")
    onError("")

    try {
      await deleteSessionService(patientId, sessionId)
      const nextSessions = sessions.filter((session) => session.id !== sessionId)
      onSessionsChange(nextSessions)

      if (expandedSessionId === sessionId) {
        setExpandedSessionId(nextSessions[0]?.id || null)
      }

      if (editingSessionId === sessionId) {
        setEditingSessionId(null)
        setEditForm(null)
      }

      setSessionMessage("Sesion eliminada correctamente.")
    } catch (error) {
      onError("Error al eliminar la sesion.")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => (
    new Date(dateString).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  )

  const getFileUrl = (url: string) => new URL(url, API_URL).toString()

  const handleUploadTaskFile = async (sessionId: string, taskId: string, file: File) => {
    const taskKey = `${sessionId}:${taskId}`
    setUploadingTaskKey(taskKey)
    setSessionMessage("")
    onError("")

    try {
      const createdFile = await uploadSessionTaskFileService(patientId, sessionId, taskId, file)
      onSessionsChange(
        sessions.map((session) =>
          session.id === sessionId
            ? {
              ...session,
              sessionTasks: session.sessionTasks.map((sessionTask) =>
                sessionTask.id === taskId
                  ? { ...sessionTask, files: [createdFile, ...(sessionTask.files ?? [])] }
                  : sessionTask
              )
            }
            : session
        )
      )
      setSessionMessage("Archivo adjuntado a la sesion.")
    } catch (error) {
      onError("Error al subir el archivo de la sesion.")
    } finally {
      setUploadingTaskKey(null)
    }
  }

  const handleDeleteTaskFile = async (sessionId: string, taskId: string, fileId: string) => {
    const taskKey = `${sessionId}:${taskId}:${fileId}`
    setUploadingTaskKey(taskKey)
    setSessionMessage("")
    onError("")

    try {
      await deleteSessionTaskFileService(patientId, sessionId, taskId, fileId)
      onSessionsChange(
        sessions.map((session) =>
          session.id === sessionId
            ? {
              ...session,
              sessionTasks: session.sessionTasks.map((sessionTask) =>
                sessionTask.id === taskId
                  ? {
                    ...sessionTask,
                    files: sessionTask.files.filter((file) => file.id !== fileId)
                  }
                  : sessionTask
              )
            }
            : session
        )
      )
      setSessionMessage("Archivo eliminado de la sesion.")
    } catch (error) {
      onError("Error al eliminar el archivo de la sesion.")
    } finally {
      setUploadingTaskKey(null)
    }
  }

const renderSessionForm = (
  form: SessionFormState,
  setForm: Dispatch<SetStateAction<SessionFormState>>,
  actionLabel: string,
  submitDisabled: boolean,
  submitMode: "submit" | "button",
  actionHandler?: () => void
) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Fecha de la sesion</label>
          <input
            type="date"
            value={form.date}
            onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Resumen de lo trabajado</label>
          <textarea
            value={form.whatWasDone}
            onChange={(event) => setForm((current) => ({ ...current, whatWasDone: event.target.value }))}
            className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Describe lo trabajado, avances, dificultades o acuerdos de la sesion."
            required
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Jerarquizacion de contenidos de intervencion
            </h4>
            <button
              type="button"
              onClick={() => setForm((current) => ({
                ...current,
                contentHierarchy: [...current.contentHierarchy, ""]
              }))}
              className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              + Agregar contenido
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {form.contentHierarchy.map((item, index) => (
            <div key={`hierarchy-${index}`} className="grid grid-cols-[56px_minmax(0,1fr)] gap-0">
              <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {index + 1}
              </div>
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  type="text"
                  value={item}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    contentHierarchy: current.contentHierarchy.map((currentItem, currentIndex) =>
                      currentIndex === index ? event.target.value : currentItem
                    )
                  }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder={`Contenido priorizado ${index + 1}`}
                />
                {form.contentHierarchy.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({
                      ...current,
                      contentHierarchy: current.contentHierarchy.filter((_, currentIndex) => currentIndex !== index)
                    }))}
                    className="shrink-0 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
          {[
            { label: "Criterio(s) de jerarquizacion", key: "hierarchyCriteria" as const },
            { label: "Enfoque", key: "focus" as const },
            { label: "Modalidad", key: "modality" as const },
            { label: "Estrategia/s", key: "strategies" as const }
          ].map((field) => (
            <div
              key={field.key}
              className="grid grid-cols-1 border-t border-slate-200 md:grid-cols-[240px_minmax(0,1fr)]"
            >
              <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {field.label}
              </div>
              <div className="px-3 py-2">
                {field.key === "strategies" ? (
                  <textarea
                    value={form[field.key]}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    required
                  />
                ) : (
                  <input
                    type="text"
                    value={form[field.key]}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    required
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Objetivo general / meta
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)]">
          <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            O.G.1
          </div>
          <div className="px-3 py-2">
            <textarea
              value={form.generalObjective}
              onChange={(event) => setForm((current) => ({ ...current, generalObjective: event.target.value }))}
              className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Objetivos especificos y operacionales
            </h4>
            <button
              type="button"
              onClick={() => setForm((current) => ({
                ...current,
                specificObjectives: [
                  ...current.specificObjectives,
                  createSpecificObjective()
                ]
              }))}
              className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              + Agregar O.E.
            </button>
          </div>
        </div>
        <div className="space-y-4 p-4">
          {form.specificObjectives.map((specificObjective, specificIndex) => (
            <div key={`specific-${specificIndex}`} className="rounded-2xl border border-slate-200">
              <div className="grid grid-cols-1 gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-700">O.E.{specificIndex + 1}</p>
                    {form.specificObjectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({
                          ...current,
                          specificObjectives: current.specificObjectives.filter((_, index) => index !== specificIndex)
                        }))}
                        className="text-xs font-medium text-rose-500 hover:text-rose-700"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <textarea
                    value={specificObjective.description}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      specificObjectives: current.specificObjectives.map((currentObjective, currentIndex) =>
                        currentIndex === specificIndex
                          ? { ...currentObjective, description: event.target.value }
                          : currentObjective
                      )
                    }))}
                    className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Describe el objetivo especifico."
                    required
                  />
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-700">Objetivos operacionales</p>
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({
                        ...current,
                        specificObjectives: current.specificObjectives.map((currentObjective, currentIndex) =>
                          currentIndex === specificIndex
                            ? {
                              ...currentObjective,
                              operationalObjectives: [
                                ...currentObjective.operationalObjectives,
                                createOperationalObjective()
                              ]
                            }
                            : currentObjective
                        )
                      }))}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      + Agregar O.O.
                    </button>
                  </div>
                  <div className="space-y-3">
                    {specificObjective.operationalObjectives.map((operationalObjective, operationalIndex) => (
                      <div key={`operational-${specificIndex}-${operationalIndex}`} className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-700">O.O.{operationalIndex + 1}</p>
                          {specificObjective.operationalObjectives.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setForm((current) => ({
                                ...current,
                                specificObjectives: current.specificObjectives.map((currentObjective, currentIndex) =>
                                  currentIndex === specificIndex
                                    ? {
                                      ...currentObjective,
                                      operationalObjectives: currentObjective.operationalObjectives.filter(
                                        (_, index) => index !== operationalIndex
                                      )
                                    }
                                    : currentObjective
                                )
                              }))}
                              className="text-xs font-medium text-rose-500 hover:text-rose-700"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={operationalObjective.description}
                          onChange={(event) => setForm((current) => ({
                            ...current,
                            specificObjectives: current.specificObjectives.map((currentObjective, currentIndex) =>
                              currentIndex === specificIndex
                                ? {
                                  ...currentObjective,
                                  operationalObjectives: currentObjective.operationalObjectives.map(
                                    (currentOperationalObjective, currentOperationalIndex) =>
                                      currentOperationalIndex === operationalIndex
                                        ? {
                                          ...currentOperationalObjective,
                                          description: event.target.value
                                        }
                                        : currentOperationalObjective
                                  )
                                }
                                : currentObjective
                            )
                          }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          placeholder="Describe el objetivo operacional."
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Tareas e indicaciones de la sesion
            </h4>
            <button
              type="button"
              onClick={() => setForm((current) => ({
                ...current,
                sessionTasks: [...current.sessionTasks, createTask()]
              }))}
              className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              + Agregar indicacion
            </button>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {form.sessionTasks.map((sessionTask, taskIndex) => (
            <div key={`task-${taskIndex}`} className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Indicacion {taskIndex + 1}</p>
                {form.sessionTasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({
                      ...current,
                      sessionTasks: current.sessionTasks.filter((_, index) => index !== taskIndex)
                    }))}
                    className="text-xs font-medium text-rose-500 hover:text-rose-700"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
                <input
                  type="text"
                  value={sessionTask.title}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    sessionTasks: current.sessionTasks.map((currentTask, currentIndex) =>
                      currentIndex === taskIndex
                        ? { ...currentTask, title: event.target.value }
                        : currentTask
                    )
                  }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Titulo o nombre de la indicacion"
                  required
                />
                <textarea
                  value={sessionTask.description || ""}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    sessionTasks: current.sessionTasks.map((currentTask, currentIndex) =>
                      currentIndex === taskIndex
                        ? { ...currentTask, description: event.target.value }
                        : currentTask
                    )
                  }))}
                  className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Detalles, practica para casa, materiales o acuerdos con la familia."
                />
              </div>

              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Archivo para la indicacion</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {sessionTask.id
                        ? "Puedes adjuntar PDF, Word o imagenes directamente a esta indicacion."
                        : "Guarda la sesion primero para poder adjuntar PDF, Word o imagenes a esta indicacion."}
                    </p>
                  </div>
                  {sessionTask.id && editingSessionId ? (
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={Boolean(uploadingTaskKey)}
                        onChange={async (event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          await handleUploadTaskFile(editingSessionId, sessionTask.id!, file)
                          event.target.value = ""
                        }}
                      />
                      {uploadingTaskKey === `${editingSessionId}:${sessionTask.id}` ? "Subiendo..." : "Adjuntar archivo"}
                    </label>
                  ) : null}
                </div>

                {sessionTask.id ? (
                  <TaskFilesList
                    files={sessionTask.files ?? []}
                    getFileIcon={getFileIcon}
                    getFileUrl={getFileUrl}
                    deletingKeyPrefix={editingSessionId ? `${editingSessionId}:${sessionTask.id}` : ""}
                    uploadingTaskKey={uploadingTaskKey}
                    onDelete={(fileId) => editingSessionId && handleDeleteTaskFile(editingSessionId, sessionTask.id!, fileId)}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type={submitMode}
          onClick={submitMode === "button" ? actionHandler : undefined}
          disabled={submitDisabled}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitDisabled ? "Guardando..." : actionLabel}
        </button>
      </div>
    </div>
  )

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-slate-900 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Seguimiento clinico</p>
          <h3 className="mt-2 text-xl font-semibold">Sesiones de intervencion</h3>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            Cada sesion integra jerarquizacion, objetivo general, objetivos especificos, objetivos operacionales
            e indicaciones en una sola ficha.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm((current) => !current)
            setEditingSessionId(null)
            setEditForm(null)
            setSessionMessage("")
          }}
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          {showCreateForm ? "Cancelar nueva sesion" : "+ Nueva sesion"}
        </button>
      </div>

      {sessionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {sessionMessage}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateSession} className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-400">Nueva sesion</p>
            <h4 className="mt-1 text-lg font-semibold text-slate-800">Planificacion de sesion</h4>
          </div>
          {renderSessionForm(createForm, setCreateForm, "Guardar sesion", saving, "submit")}
        </form>
      )}

      {orderedSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">Aun no hay sesiones registradas para este paciente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orderedSessions.map((session) => {
            const completionState = getCompletionState(session)
            const isExpanded = expandedSessionId === session.id
            const isEditing = editingSessionId === session.id

            return (
              <article key={session.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                          Sesion {session.sessionNumber}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${completionState.styles}`}>
                          {completionState.label}
                        </span>
                        <span className="text-sm text-slate-500">{formatDate(session.date)}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Resumen</p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-700">{session.whatWasDone}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Objetivos especificos</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{session.specificObjectives.length}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Indicaciones</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{session.sessionTasks.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedSessionId((current) => current === session.id ? null : session.id)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
                      >
                        {isExpanded ? "Ocultar detalle" : "Ver ficha"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedSessionId(session.id)
                          setEditingSessionId(session.id)
                          setShowCreateForm(false)
                          setEditForm(mapSessionToForm(session))
                          setSessionMessage("")
                        }}
                        className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(session.id)}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 sm:p-6">
                    {isEditing && editForm ? (
                      <div className="space-y-4">
                        {renderSessionForm(
                          editForm,
                          setEditForm,
                          "Guardar cambios",
                          saving,
                          "button",
                          () => handleUpdateSession(session.id)
                        )}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSessionId(null)
                              setEditForm(null)
                            }}
                            className="text-sm font-medium text-slate-500 hover:text-slate-700"
                          >
                            Cancelar edicion
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <section className="rounded-2xl border border-slate-200">
                          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                              Jerarquizacion de contenidos de intervencion
                            </h4>
                          </div>
                          <div className="divide-y divide-slate-200">
                            {session.contentHierarchy.map((item, index) => (
                              <div key={`content-view-${session.id}-${index}`} className="grid grid-cols-[56px_minmax(0,1fr)]">
                                <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                  {index + 1}
                                </div>
                                <div className="px-4 py-3 text-sm text-slate-700">{item || "—"}</div>
                              </div>
                            ))}
                            {[
                              ["Criterio(s) de jerarquizacion", session.hierarchyCriteria],
                              ["Enfoque", session.focus],
                              ["Modalidad", session.modality],
                              ["Estrategia/s", session.strategies]
                            ].map(([label, value]) => (
                              <div key={`${session.id}-${label}`} className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
                                <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                                  {label}
                                </div>
                                <div className="px-4 py-3 text-sm text-slate-700">{value || "—"}</div>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200">
                          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                              Objetivo general / meta
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)]">
                            <div className="border-r border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                              O.G.1
                            </div>
                            <div className="px-4 py-3 text-sm text-slate-700">{session.generalObjective}</div>
                          </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-slate-200">
                          <div className="overflow-x-auto">
                            <div className="min-w-[720px]">
                              <div className="grid grid-cols-[260px_minmax(0,1fr)] border-b border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                                <div className="border-r border-slate-200 px-4 py-3">Objetivos especificos (O.E.)</div>
                                <div className="px-4 py-3">Objetivos operacionales (O.O.)</div>
                              </div>
                              <div className="divide-y divide-slate-200">
                                {session.specificObjectives.map((specificObjective, specificIndex) => (
                                  <div key={specificObjective.id} className="grid grid-cols-[260px_minmax(0,1fr)]">
                                    <div className="border-r border-slate-200 bg-slate-50 px-4 py-4">
                                      <p className="text-sm font-semibold text-slate-700">O.E.{specificIndex + 1}</p>
                                      <p className="mt-2 text-sm text-slate-700">{specificObjective.description}</p>
                                    </div>
                                    <div className="px-4 py-4">
                                      <div className="space-y-3">
                                        {specificObjective.operationalObjectives.map((operationalObjective, operationalIndex) => (
                                          <div key={operationalObjective.id} className="rounded-xl border border-slate-200 px-4 py-3">
                                            <p className="text-sm font-semibold text-slate-700">O.O.{operationalIndex + 1}</p>
                                            <p className="mt-1 text-sm text-slate-700">{operationalObjective.description}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200">
                          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                              Tareas e indicaciones
                            </h4>
                          </div>
                          <div className="space-y-3 p-4">
                            {session.sessionTasks.length === 0 ? (
                              <p className="text-sm text-slate-500">No hay indicaciones registradas para esta sesion.</p>
                            ) : session.sessionTasks.map((sessionTask, taskIndex) => (
                              <div key={sessionTask.id} className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-sm font-semibold text-slate-800">
                                  {taskIndex + 1}. {sessionTask.title}
                                </p>
                                {sessionTask.description && (
                                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{sessionTask.description}</p>
                                )}
                                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-700">Material adjunto</p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        Sube PDF, Word o imagenes relacionadas con esta indicacion.
                                      </p>
                                    </div>
                                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="hidden"
                                        disabled={Boolean(uploadingTaskKey)}
                                        onChange={async (event) => {
                                          const file = event.target.files?.[0]
                                          if (!file) return
                                          await handleUploadTaskFile(session.id, sessionTask.id, file)
                                          event.target.value = ""
                                        }}
                                      />
                                      {uploadingTaskKey === `${session.id}:${sessionTask.id}` ? "Subiendo..." : "Adjuntar archivo"}
                                    </label>
                                  </div>

                                  {sessionTask.files.length === 0 ? (
                                    <p className="mt-3 text-sm text-slate-500">Todavia no hay archivos para esta indicacion.</p>
                                  ) : (
                                    <div className="mt-3 space-y-2">
                                      {sessionTask.files.map((file) => (
                                        <div
                                          key={file.id}
                                          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                          <a
                                            href={getFileUrl(file.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex min-w-0 items-center gap-3 text-sm text-slate-700 hover:text-indigo-600"
                                          >
                                            <span className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
                                              {getFileIcon(file.filetype)}
                                            </span>
                                            <span className="truncate">{file.filename}</span>
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTaskFile(session.id, sessionTask.id, file.id)}
                                            disabled={uploadingTaskKey === `${session.id}:${sessionTask.id}:${file.id}`}
                                            className="text-xs font-medium text-rose-500 hover:text-rose-700 disabled:opacity-50"
                                          >
                                            {uploadingTaskKey === `${session.id}:${sessionTask.id}:${file.id}` ? "Eliminando..." : "Eliminar archivo"}
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default SessionsSection
