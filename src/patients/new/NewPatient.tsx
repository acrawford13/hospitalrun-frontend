import { Button, Toast } from '@hospitalrun/components'
import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import useAddBreadcrumbs from '../../page-header/breadcrumbs/useAddBreadcrumbs'
import { useUpdateTitle } from '../../page-header/title/TitleContext'
import useTranslator from '../../shared/hooks/useTranslator'
import Patient from '../../shared/model/Patient'
import GeneralInformation, { Error } from '../GeneralInformation'
import useAddPatient from '../hooks/useAddPatient'
import { DuplicatePatientError } from '../util/validate-unique-patient'
import DuplicateNewPatientModal from './DuplicateNewPatientModal'

const breadcrumbs = [
  { i18nKey: 'patients.label', location: '/patients' },
  { i18nKey: 'patients.newPatient', location: '/patients/new' },
]

const NewPatient = () => {
  const { t } = useTranslator()
  const history = useHistory()

  const [patient, setPatient] = useState({} as Patient)
  const [duplicatePatients, setDuplicatePatients] = useState<Patient[]>([])
  const [patientError, setPatientError] = useState<Error | undefined>(undefined)

  const [showDuplicateNewPatientModal, setShowDuplicateNewPatientModal] = useState<boolean>(false)
  const [mutate] = useAddPatient()

  const updateTitle = useUpdateTitle()
  useEffect(() => {
    updateTitle(t('patients.newPatient'))
  })
  useAddBreadcrumbs(breadcrumbs, true)

  const onCancel = () => {
    history.push('/patients')
  }

  const onSuccessfulSave = (newPatient?: Patient) => {
    history.push(`/patients/${newPatient?.id}`)
    Toast(
      'success',
      t('states.success'),
      `${t('patients.successfullyCreated')} ${newPatient?.fullName}`,
    )
  }

  interface AddPatientRequest {
    flagDuplicates?: boolean
  }

  const onSave = async ({ flagDuplicates } = {} as AddPatientRequest) => {
    setShowDuplicateNewPatientModal(false)
    try {
      await mutate({ patient, flagDuplicates }).then((newPatient) => onSuccessfulSave(newPatient))
    } catch (e) {
      if (e instanceof DuplicatePatientError) {
        setShowDuplicateNewPatientModal(true)
        setDuplicatePatients(e.duplicatePatients)
      } else {
        setPatientError(e.fieldErrors)
      }
    }
  }

  const onPatientChange = (newPatient: Partial<Patient>) => {
    setPatient(newPatient as Patient)
  }

  const closeDuplicateNewPatientModal = () => {
    setShowDuplicateNewPatientModal(false)
  }

  return (
    <div>
      <GeneralInformation
        patient={patient}
        isEditable
        onChange={onPatientChange}
        error={patientError}
      />
      <div className="row float-right">
        <div className="btn-group btn-group-lg mt-3 mr-3">
          <Button
            className="btn-save mr-2"
            color="success"
            onClick={() => onSave({ flagDuplicates: true })}
          >
            {t('patients.createPatient')}
          </Button>
          <Button className="btn-cancel" color="danger" onClick={onCancel}>
            {t('actions.cancel')}
          </Button>
        </div>
      </div>

      <DuplicateNewPatientModal
        duplicatePatients={duplicatePatients}
        show={showDuplicateNewPatientModal}
        toggle={closeDuplicateNewPatientModal}
        onContinueButtonClick={() => onSave()}
        onCloseButtonClick={closeDuplicateNewPatientModal}
      />
    </div>
  )
}

export default NewPatient
