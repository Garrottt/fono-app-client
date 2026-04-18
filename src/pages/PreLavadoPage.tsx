import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import ClinicalModuleLayout from "../components/ClinicalModuleLayout"
import PreLavadoSection from "../components/PreLavadoSection"
import { getPatientsService } from "../services/patient.service"
import type { Patient } from "../types/patient.types"

function PreLavadoPage() {
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

  const getPatientStatus = (patient: Patient) => {
    if (!patient.preLavadoEvaluation) {
      return { label: "Sin registro", tone: "gray" as const }
    }

    if (!patient.preLavadoEvaluation.aptoParaLavado) {
      return { label: "No apto", tone: "red" as const }
    }

    if (patient.preLavadoEvaluation.precautionAlerts.length > 0) {
      return { label: "Con alertas", tone: "amber" as const }
    }

    return { label: "Actualizado", tone: "green" as const }
  }

  return (
    <ClinicalModuleLayout
      title="Pre-Lavado"
      description="Selecciona un paciente para evaluar aptitud, bloqueos y observaciones otoscópicas antes del procedimiento."
      patients={patients}
      loading={loading}
      error={error}
      selectedPatientId={selectedPatientId}
      selectedPatient={selectedPatient}
      onSelectPatient={(patientId) => setSearchParams({ patientId })}
      getPatientStatus={getPatientStatus}
    >
      <div className="space-y-4">
        <section className="rounded-[1.8rem] border border-white/70 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-700 px-5 py-6 text-white shadow-[0_22px_46px_rgba(15,23,42,0.18)] sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">Filtro clínico</p>
              <h2 className="fono-title mt-3 text-3xl font-semibold">Evaluación previa con decisiones visibles</h2>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Reorganicé este módulo para que los bloqueos y precauciones se perciban antes de empezar a editar el detalle, algo clave para una experiencia más intuitiva.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">Aptitud</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {selectedPatient?.preLavadoEvaluation
                    ? selectedPatient.preLavadoEvaluation.aptoParaLavado
                      ? "Apto para lavado"
                      : "No apto"
                    : "Pendiente"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">Precauciones</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {selectedPatient?.preLavadoEvaluation?.precautionAlerts.length || 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        {selectedPatient && (
          <PreLavadoSection
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

export default PreLavadoPage

