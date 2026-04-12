export type StructureStatus = "indemne" | "patologico"
export type PabellonObservation = "normal" | "inflamado" | "malformacion"
export type CaeObservation = "limpio" | "eritematoso" | "edematoso" | "presencia_hongos"
export type MembranaObservation = "integra" | "perforada" | "abombada" | "retraida"
export type SullivanScale = "0" | "+1" | "+2" | "+3"

export interface PreLavadoEvaluation {
  id: string
  patientId: string
  hasDiabetesOrImmunosuppression: boolean
  hasPreviousEarSurgeries: boolean
  hasKnownPerforation: boolean
  otalgia: boolean
  hipoacusia: boolean
  plenitudOtica: boolean
  otorrea: boolean
  prurito: boolean
  otorragia: boolean
  usesHearingAid: boolean
  hearingAidBadSmell: boolean
  dolorAlTocarTrago: boolean
  odPabellonEstado: StructureStatus
  oiPabellonEstado: StructureStatus
  odPabellonObservacion: PabellonObservation
  oiPabellonObservacion: PabellonObservation
  odCaeEstado: StructureStatus
  oiCaeEstado: StructureStatus
  odCaeObservacion: CaeObservation
  oiCaeObservacion: CaeObservation
  odMembranaEstado: StructureStatus
  oiMembranaEstado: StructureStatus
  odMembranaObservacion: MembranaObservation
  oiMembranaObservacion: MembranaObservation
  odSullivan: SullivanScale
  oiSullivan: SullivanScale
  odObservaciones?: string
  oiObservaciones?: string
  aptoParaLavado: boolean
  criticalBlocks: string[]
  precautionAlerts: string[]
  diagnosticSummary: string
  suggestedConduct: string
  createdAt: string
  updatedAt: string
}

export interface UpdatePreLavadoInput {
  hasDiabetesOrImmunosuppression: boolean
  hasPreviousEarSurgeries: boolean
  hasKnownPerforation: boolean
  otalgia: boolean
  hipoacusia: boolean
  plenitudOtica: boolean
  otorrea: boolean
  prurito: boolean
  otorragia: boolean
  usesHearingAid: boolean
  hearingAidBadSmell: boolean
  dolorAlTocarTrago: boolean
  odPabellonEstado: StructureStatus
  oiPabellonEstado: StructureStatus
  odPabellonObservacion: PabellonObservation
  oiPabellonObservacion: PabellonObservation
  odCaeEstado: StructureStatus
  oiCaeEstado: StructureStatus
  odCaeObservacion: CaeObservation
  oiCaeObservacion: CaeObservation
  odMembranaEstado: StructureStatus
  oiMembranaEstado: StructureStatus
  odMembranaObservacion: MembranaObservation
  oiMembranaObservacion: MembranaObservation
  odSullivan: SullivanScale
  oiSullivan: SullivanScale
  odObservaciones?: string
  oiObservaciones?: string
}
