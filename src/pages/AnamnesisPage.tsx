import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
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
      } catch (fetchError) {
        setError("Error al cargar los pacientes")
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [selectedPatientId, setSearchParams])

  const handleSelectPatient = (patientId: string) => {
    setSearchParams({ patientId })
  }

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
      description="Selecciona un paciente para cargar o editar su anamnesis."
      patients={patients}
      loading={loading}
      error={error}
      selectedPatientId={selectedPatientId}
      selectedPatient={selectedPatient}
      onSelectPatient={handleSelectPatient}
      getPatientStatus={getPatientStatus}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">{selectedPatient?.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Modulo clinico de anamnesis del paciente.
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
