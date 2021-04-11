import isEmpty from 'lodash/isEmpty'
import { useMutation, queryCache } from 'react-query'

import PatientRepository from '../../shared/db/PatientRepository'
import Patient from '../../shared/model/Patient'
import { isPossibleDuplicatePatient } from '../util/is-possible-duplicate-patient'
import { getPatientFullName } from '../util/patient-util'
import { cleanupPatient } from '../util/set-patient-helper'
import validatePatient from '../util/validate-patient'

interface AddPatientRequest {
  patient: Patient
  flagDuplicates?: boolean
}

export class DuplicatePatientError extends Error {
  public duplicatePatients: Patient[]

  constructor() {
    super('This may be a duplicate')
    this.name = 'DuplicatePatientError'
    this.duplicatePatients = []
  }

  get count(): number {
    return this.duplicatePatients.length
  }
}

async function addPatient(request: AddPatientRequest): Promise<Patient> {
  const cleanPatient = cleanupPatient(request.patient)
  const newPatientError = validatePatient(cleanPatient)

  if (isEmpty(newPatientError)) {
    if (request.flagDuplicates) {
      const patientFullName = getPatientFullName(request.patient)
      const similarPatients = await PatientRepository.search(patientFullName)

      const duplicates = similarPatients.filter((existingPatient: any) =>
        isPossibleDuplicatePatient(request.patient, existingPatient),
      ) as Patient[]

      if (duplicates.length) {
        const duplicateError = new DuplicatePatientError()
        duplicateError.duplicatePatients = duplicates
        throw duplicateError
      }
    }

    const newPatient = await PatientRepository.save(cleanPatient)
    return newPatient as Patient
  }

  throw newPatientError
}

export default function useAddPatient() {
  return useMutation(addPatient, {
    onSuccess: async (data) => {
      await queryCache.setQueryData(['patients', 'patients', data.id], data)
    },
    throwOnError: true,
  })
}
