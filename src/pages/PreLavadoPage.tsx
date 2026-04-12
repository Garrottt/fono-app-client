import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
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
      } catch (fetchError) {
        setError("Error al cargar los pacientes")
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
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
      description="Selecciona un paciente para registrar su evaluacion otoscopica."
      patients={patients}
      loading={loading}
      error={error}
      selectedPatientId={selectedPatientId}
      selectedPatient={selectedPatient}
      onSelectPatient={(patientId) => setSearchParams({ patientId })}
      getPatientStatus={getPatientStatus}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{selectedPatient?.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Modulo de evaluacion pre-lavado para soporte clinico otico.
            </p>
          </div>
          {selectedPatient && (
            <Link
              to={`/patients/${selectedPatient.id}`}
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Ver ficha completa
            </Link>
          )}
        </div>

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
