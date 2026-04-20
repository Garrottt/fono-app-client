import { useMemo, useState } from "react"
import type { ReactNode } from "react"
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
  gray: "border-slate-200 bg-slate-100 text-slate-600",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-rose-200 bg-rose-50 text-rose-700"
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
  const [showPatients, setShowPatients] = useState(false)

  const filteredPatients = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return patients

    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(normalized) ||
      patient.email?.toLowerCase().includes(normalized) ||
      patient.phone?.toLowerCase().includes(normalized)
    )
  }, [patients, search])

  const patientsWithRecords = useMemo(
    () => patients.filter((patient) => patient.anamnesis || patient.preLavadoEvaluation).length,
    [patients]
  )

  const patientsPanel = (
    <div className="flex h-full flex-col">
      <div className="rounded-[1.7rem] border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-800 p-5 text-white shadow-[0_24px_44px_rgba(15,23,42,0.22)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Workspace clínico</p>
        <h2 className="fono-title mt-3 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-white/72">{description}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/55">Pacientes</p>
            <p className="mt-2 text-xl font-semibold text-white">{patients.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/55">Con avance</p>
            <p className="mt-2 text-xl font-semibold text-white">{patientsWithRecords}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-white/70 bg-white/76 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Buscar paciente
        </label>
        <div className="relative mt-2">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre, email o teléfono"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              <circle cx="11" cy="11" r="6.5" />
            </svg>
          </span>
        </div>
        <Link
          to="/patients"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
        >
          Ir a gestión de pacientes
          <span aria-hidden="true">&gt;</span>
        </Link>
      </div>

      <div className="mt-4 flex-1 overflow-auto rounded-[1.5rem] border border-white/70 bg-white/72 p-3 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
            Cargando pacientes...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-600">
            {error}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
            {patients.length === 0
              ? "No hay pacientes registrados todavía."
              : "No se encontraron pacientes con ese filtro."}
          </div>
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
                  className={`w-full rounded-[1.3rem] border px-4 py-4 text-left transition-all ${
                    isActive
                      ? "border-teal-200 bg-gradient-to-r from-teal-50 to-white shadow-[0_18px_30px_rgba(20,184,166,0.12)]"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${isActive ? "text-teal-800" : "text-slate-900"}`}>
                        {patient.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {patient.email || patient.phone || "Sin contacto registrado"}
                      </p>
                      {patient.diagnosis && (
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                          {patient.diagnosis}
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneStyles[status.tone]}`}>
                      {status.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="grid gap-4 p-3 sm:p-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:gap-5">
      <aside className="hidden min-h-[calc(100vh-13rem)] xl:block">{patientsPanel}</aside>

      <div className="xl:hidden">
        <div className="rounded-[1.6rem] border border-white/70 bg-white/76 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Módulo clínico</p>
              <h2 className="fono-title mt-1 text-2xl font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPatients((current) => !current)}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
            >
              {showPatients
                ? "Ocultar pacientes"
                : selectedPatient
                  ? `Paciente: ${selectedPatient.name}`
                  : "Seleccionar paciente"}
            </button>
          </div>

          {showPatients && <div className="mt-4">{patientsPanel}</div>}
        </div>
      </div>

      <main className="min-w-0 space-y-4">
        {selectedPatient ? (
          <div className="rounded-[1.8rem] border border-white/70 bg-white/78 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Paciente activo</p>
                <h3 className="fono-title mt-2 text-2xl font-semibold text-slate-950 sm:text-[2rem]">
                  {selectedPatient.name}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {selectedPatient.diagnosis || "Sin diagnóstico clínico resumido. Puedes completar la ficha para enriquecer el contexto del módulo."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedPatient.age !== undefined && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    {selectedPatient.age} años
                  </span>
                )}
                {selectedPatient.email && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    {selectedPatient.email}
                  </span>
                )}
                {selectedPatient.phone && (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    {selectedPatient.phone}
                  </span>
                )}
                <Link
                  to={`/patients/${selectedPatient.id}`}
                  className="rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_28px_rgba(20,184,166,0.18)] transition hover:bg-teal-700"
                >
                  Ver ficha completa
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white/70 px-5 py-14 text-center shadow-[0_18px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Sin paciente seleccionado</p>
            <h3 className="fono-title mt-3 text-2xl font-semibold text-slate-950">Elige un paciente para continuar</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              El selector lateral agrupa la información clave para que el cambio de contexto sea rápido incluso desde celular.
            </p>
          </div>
        )}

        {selectedPatient && children}
      </main>
    </div>
  )
}

export default ClinicalModuleLayout
