import Patient from '../../shared/model/Patient'
import { isPossibleDuplicatePatient } from './is-possible-duplicate-patient'

export class DuplicatePatientError extends Error {
  public duplicatePatients: Patient[]

  constructor() {
    super('Possible duplicate patient')
    this.name = 'DuplicatePatientError'
    this.duplicatePatients = []
  }

  get count(): number {
    return this.duplicatePatients.length
  }
}

export default function validateUniquePatient(patient: Patient, similarPatients: Patient[]) {
  const error = new DuplicatePatientError()

  const duplicates = similarPatients.filter((existingPatient: any) =>
    isPossibleDuplicatePatient(patient, existingPatient),
  ) as Patient[]

  if (duplicates.length) {
    error.duplicatePatients = duplicates
  }

  if (error.count === 0) {
    return null
  }

  return error
}
