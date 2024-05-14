import isEmpty from 'lodash/isEmpty'
import { useMutation, queryCache } from 'react-query'

import PatientRepository from '../../shared/db/PatientRepository'
import Patient from '../../shared/model/Patient'
import { getPatientFullName } from '../util/patient-util'
import { cleanupPatient } from '../util/set-patient-helper'
import validatePatient from '../util/validate-patient'
import validateUniquePatient from '../util/validate-unique-patient'

interface AddPatientRequest {
  patient: Patient
  flagDuplicates?: boolean
}

async function addPatient(request: AddPatientRequest): Promise<Patient> {
  let duplicateError
  const cleanPatient = cleanupPatient(request.patient)
  const error = validatePatient(cleanPatient)

  if (request.flagDuplicates) {
    const patientFullName = getPatientFullName(request.patient)
    const similarPatients = await PatientRepository.search(patientFullName)
    duplicateError = validateUniquePatient(cleanPatient, similarPatients)
  }

  if (isEmpty(error) && isEmpty(duplicateError)) {
    const newPatient = await PatientRepository.save(cleanPatient)
    return newPatient as Patient
  }

  if (!isEmpty(duplicateError)) {
    throw duplicateError
  }

  throw error
}

export default function useAddPatient() {
  return useMutation(addPatient, {
    onSuccess: async () => {
      await queryCache.invalidateQueries('patients')
    },
    throwOnError: true,
  })
}
