import { Modal, Alert } from '@hospitalrun/components'
import React from 'react'
import { Link } from 'react-router-dom'

import useTranslator from '../../shared/hooks/useTranslator'
import Patient from '../../shared/model/Patient'

interface Props {
  duplicatePatients: Patient[]
  show: boolean
  toggle: () => void
  onCloseButtonClick: () => void
  onContinueButtonClick: () => void
}

const DuplicateNewPatientModal = (props: Props) => {
  const { t } = useTranslator()
  const { duplicatePatients, show, toggle, onCloseButtonClick, onContinueButtonClick } = props

  const body = (
    <>
      <Alert
        color="warning"
        title={t('patients.warning')}
        message={t('patients.duplicatePatientWarning')}
      />
      <div className="row">
        <div className="col-md-12">
          {t('patients.possibleDuplicatePatient')}
          {duplicatePatients.map((patient) => (
            <li key={patient.id}>
              <Link to={`/patients/${patient.id}`}>
                {patient.givenName} {patient.familyName}
              </Link>
            </li>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <Modal
      show={show}
      toggle={toggle}
      title={t('patients.newPatient')}
      body={body}
      closeButton={{
        children: t('actions.cancel'),
        color: 'danger',
        onClick: onCloseButtonClick,
      }}
      successButton={{
        children: t('actions.save'),
        color: 'success',
        onClick: onContinueButtonClick,
      }}
    />
  )
}

export default DuplicateNewPatientModal
