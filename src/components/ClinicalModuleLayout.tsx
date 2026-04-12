import { ReactNode, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { Patient } from "../types/patient.types"

interface PatientStatus {
  label: string
  tone: "gray" | "green" | "amber" | "red"
}

interface Props {
  title: string
  description: string
  patients: Patient[]
  loading: boolean
  error: string
  selectedPatientId: string
  selectedPatient: Patient | null
  onSelectPatient: (patientId: string) => void
  getPatientStatus: (patient: Patient) => PatientStatus
  children: ReactNode
}

const toneStyles: Record<PatientStatus["tone"], string> = {
  gray: "bg-gray-100 text-gray-600 border-gray-200",
  green: "bg-green-50 text-green-700 border-green-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200"
}

function ClinicalModuleLayout({
  title,
  description,
  patients,
  loading,
  error,
  selectedPatientId,
  selectedPatient,
  onSelectPatient,
  getPatientStatus,
  children
}: Props) {
  const [search, setSearch] = useState("")

  const filteredPatients = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return patients

    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(normalized) ||
      patient.email?.toLowerCase().includes(normalized)
    )
  }, [patients, search])

  return (
    <div className="h-full flex">
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-100 space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar paciente..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="p-4 border-b border-gray-100">
          <Link
            to="/patients"
            className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Ir a gestion de pacientes
          </Link>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {loading ? (
            <p className="text-sm text-gray-400">Cargando pacientes...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : filteredPatients.length === 0 ? (
            <p className="text-sm text-gray-400">
              {patients.length === 0 ? "No hay pacientes registrados todavia." : "No se encontraron pacientes con ese filtro."}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map((patient) => {
                const isActive = patient.id === selectedPatientId
                const status = getPatientStatus(patient)

                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => onSelectPatient(patient.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${isActive ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-indigo-700" : "text-gray-800"}`}>
                          {patient.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {patient.email || patient.phone || "Sin contacto"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${toneStyles[status.tone]}`}>
                        {status.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        {!selectedPatient ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <p className="text-gray-500">Selecciona un paciente para trabajar en este modulo.</p>
          </div>
        ) : children}
      </main>
    </div>
  )
}

export default ClinicalModuleLayout
