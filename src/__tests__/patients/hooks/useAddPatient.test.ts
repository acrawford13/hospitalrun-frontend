import useAddPatient from '../../../patients/hooks/useAddPatient'
import * as validatePatient from '../../../patients/util/validate-patient'
import * as validateUniquePatient from '../../../patients/util/validate-unique-patient'
import PatientRepository from '../../../shared/db/PatientRepository'
import Patient from '../../../shared/model/Patient'
import { expectOneConsoleError } from '../../test-utils/console.utils'
import executeMutation from '../../test-utils/use-mutation.util'

describe('use add patient', () => {
  const patient = {
    id: '123',
    givenName: 'givenName',
    familyName: 'familyName',
    sex: 'male',
    dateOfBirth: '01/01/2020',
  } as Patient

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should throw an error if patient validation fails', async () => {
    const expectedError = { name: 'some error' }
    expectOneConsoleError(expectedError as Error)
    jest.spyOn(validatePatient, 'default').mockReturnValue(expectedError)
    jest.spyOn(PatientRepository, 'save')

    try {
      await executeMutation(() => useAddPatient(), {
        patient,
      })
    } catch (e) {
      expect(e).toEqual(expectedError)
    }

    expect(PatientRepository.save).not.toHaveBeenCalled()
  })

  it('should throw an error if a duplicate patient exists and flagDuplicates is true', async () => {
    const expectedError = { name: 'some error' }
    expectOneConsoleError(expectedError as Error)
    jest.spyOn(validateUniquePatient, 'default').mockReturnValue(expectedError)
    jest.spyOn(PatientRepository, 'save')

    try {
      await executeMutation(() => useAddPatient(), {
        patient,
        flagDuplicates: true,
      })
    } catch (e) {
      expect(e).toEqual(expectedError)
    }

    expect(PatientRepository.save).not.toHaveBeenCalled()
  })

  it('should ignore duplicates error if flagDuplicates is false', async () => {
    const expectedError = { name: 'some error' }
    expectOneConsoleError(expectedError as Error)
    jest.spyOn(validateUniquePatient, 'default').mockReturnValue(expectedError)
    jest.spyOn(PatientRepository, 'save')

    await executeMutation(() => useAddPatient(), {
      patient,
    })

    expect(PatientRepository.save).toHaveBeenCalled()
  })
})
