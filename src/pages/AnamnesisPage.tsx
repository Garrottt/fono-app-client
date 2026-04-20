import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import AnamnesisSection from "../components/AnamnesisSection"
import ClinicalModuleLayout from "../components/ClinicalModuleLayout"
import { getPatientsService } from "../services/patient.service"
import type { Patient } from "../types/patient.types"

function AnamnesisPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const selectedPatientId = searchParams.get("patientId") || ""
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) || null

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatientsService()
        setPatients(data)

        if (!selectedPatientId && data.length > 0) {
          setSearchParams({ patientId: data[0].id }, { replace: true })
        }
      } catch {
        setError("Error al cargar los pacientes")
      } finally {
        setLoading(false)
      }
    }

    void fetchPatients()
  }, [selectedPatientId, setSearchParams])

  const handleSelectPatient = (patientId: string) => {
    setSearchParams({ patientId })
  }

  const alertCount = useMemo(() => {
    if (!selectedPatient?.anamnesis) return 0

    return [
      selectedPatient.anamnesis.hasDiabetesOrImmunosuppression,
      selectedPatient.anamnesis.hasPreviousEarSurgeries,
      selectedPatient.anamnesis.otorrea,
      selectedPatient.anamnesis.otorragia
    ].filter(Boolean).length
  }, [selectedPatient])

  const getPatientStatus = (patient: Patient) => {
    if (!patient.anamnesis) {
      return { label: "Sin registro", tone: "gray" as const }
    }

    const hasAlerts =
      patient.anamnesis.hasDiabetesOrImmunosuppression ||
      patient.anamnesis.hasPreviousEarSurgeries ||
      patient.anamnesis.otorrea ||
      patient.anamnesis.otorragia

    return hasAlerts
      ? { label: "Con alertas", tone: "amber" as const }
      : { label: "Actualizado", tone: "green" as const }
  }

  return (
    <ClinicalModuleLayout
      title="Anamnesis"
      description="Selecciona un paciente para revisar antecedentes, factores de riesgo y señales de alerta antes de continuar el flujo clínico."
      patients={patients}
      loading={loading}
      error={error}
      selectedPatientId={selectedPatientId}
      selectedPatient={selectedPatient}
      onSelectPatient={handleSelectPatient}
      getPatientStatus={getPatientStatus}
    >
      <div className="space-y-4">
        <section className="rounded-[1.8rem] border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-800 px-5 py-6 text-white shadow-[0_22px_46px_rgba(15,23,42,0.18)] sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Módulo clínico</p>
              <h2 className="fono-title mt-3 text-3xl font-semibold">Antecedentes y red flags en una sola vista</h2>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Esta interfaz pone primero los datos que afectan la decisión clínica y deja la edición
                completa un poco más abajo, para que el flujo sea más intuitivo.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">Estado</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {selectedPatient?.anamnesis ? "Anamnesis registrada" : "Pendiente de completar"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">Alertas</p>
                <p className="mt-2 text-lg font-semibold text-white">{alertCount}</p>
              </div>
            </div>
          </div>
        </section>

        {selectedPatient && (
          <AnamnesisSection
            patientId={selectedPatient.id}
            patientName={selectedPatient.name}
            patientAge={selectedPatient.age}
            patientDiagnosis={selectedPatient.diagnosis}
          />
        )}
      </div>
    </ClinicalModuleLayout>
  )
}

export default AnamnesisPage
