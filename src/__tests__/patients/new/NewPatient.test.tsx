import * as components from '@hospitalrun/components'
import { Toaster } from '@hospitalrun/components'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory } from 'history'
import React from 'react'
import { Provider } from 'react-redux'
import { Router, Route } from 'react-router-dom'
import createMockStore, { MockStore } from 'redux-mock-store'
import thunk from 'redux-thunk'

import * as titleUtil from '../../../page-header/title/TitleContext'
import NewPatient from '../../../patients/new/NewPatient'
import * as validatePatient from '../../../patients/util/validate-patient'
import * as validateUniquePatient from '../../../patients/util/validate-unique-patient'
import PatientRepository from '../../../shared/db/PatientRepository'
import Patient from '../../../shared/model/Patient'
import { RootState } from '../../../shared/store'
import { expectOneConsoleError } from '../../test-utils/console.utils'

const { TitleProvider } = titleUtil
const mockStore = createMockStore<RootState, any>([thunk])

describe('New Patient', () => {
  const patient = {
    id: '123',
    givenName: 'givenName',
    fullName: 'givenName familyName',
    familyName: 'familyName',
    sex: 'male',
    dateOfBirth: new Date('01-01-2020').toISOString(),
  } as Patient

  let history: any
  let store: MockStore

  const setup = () => {
    jest.spyOn(PatientRepository, 'save').mockResolvedValue(patient)
    jest.spyOn(PatientRepository, 'search').mockResolvedValue([])
    history = createMemoryHistory()
    store = mockStore({ patient: { patient: {} as Patient } } as any)

    history.push('/patients/new')

    return render(
      <Provider store={store}>
        <Router history={history}>
          <Route path="/patients/new">
            <TitleProvider>
              <NewPatient />
            </TitleProvider>
          </Route>
        </Router>
        <Toaster draggable hideProgressBar />
      </Provider>,
    )
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should render a general information form', async () => {
    setup()
    expect(screen.getByText(/patient\.basicInformation/i))
  })

  it('should render error messages when validation fails', async () => {
    setup()

    const fieldErrors = { fieldErrors: { givenName: 'Invalid' } }
    jest.spyOn(validatePatient, 'default').mockReturnValue(fieldErrors)
    expectOneConsoleError(fieldErrors)

    userEvent.click(screen.getByRole('button', { name: /patients\.createPatient/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/patient\.errors\.updatePatientError/i)
      expect(screen.getByLabelText(/patient\.givenName/i)).toHaveClass('is-invalid')
    })
  })

  it('should dispatch createPatient when save button is clicked', async () => {
    setup()
    userEvent.type(screen.getByLabelText(/patient\.givenName/i), patient.givenName as string)
    userEvent.type(screen.getByLabelText(/patient\.familyName/i), patient.familyName as string)
    userEvent.click(screen.getByRole('button', { name: /patients\.createPatient/i }))
    await waitFor(() => {
      expect(PatientRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: patient.fullName,
          givenName: patient.givenName,
          familyName: patient.familyName,
        }),
      )
    })
  })

  it('should reveal modal when save button is clicked if an existing patient has the same information', async () => {
    const { container } = setup()

    const expectedError = new validateUniquePatient.DuplicatePatientError()
    jest.spyOn(validateUniquePatient, 'default').mockReturnValue(expectedError)
    jest.spyOn(PatientRepository, 'search').mockResolvedValue([patient])

    expectOneConsoleError(expectedError)

    userEvent.type(screen.getByLabelText(/patient\.givenName/i), patient.givenName as string)
    userEvent.type(screen.getByLabelText(/patient\.familyName/i), patient.familyName as string)
    userEvent.type(
      screen.getAllByPlaceholderText('-- Choose --')[0],
      `${patient.sex}{arrowdown}{enter}`,
    )
    userEvent.type(
      (container.querySelector('.react-datepicker__input-container') as HTMLInputElement)
        .children[0],
      '{selectall}01/01/2020{enter}',
    )
    userEvent.click(screen.getByRole('button', { name: /patients\.createPatient/i }))

    await waitFor(() => {
      expect(PatientRepository.search).toHaveBeenCalledWith('givenName familyName')
    })

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(await screen.getByText(/patients.duplicatePatientWarning/i)).toBeInTheDocument()
  })

  it('should navigate to /patients/:id and display a message after a new patient is successfully created', async () => {
    jest.spyOn(components, 'Toast').mockImplementation(jest.fn())
    const { container } = setup()
    userEvent.type(screen.getByLabelText(/patient\.givenName/i), patient.givenName as string)
    userEvent.click(screen.getByRole('button', { name: /patients\.createPatient/i }))
    await waitFor(() => {
      expect(history.location.pathname).toEqual(`/patients/${patient.id}`)
    })
    await waitFor(() => {
      expect(container.querySelector('.Toastify')).toBeInTheDocument()
    })
  })

  it('should navigate to /patients when cancel is clicked', async () => {
    setup()
    userEvent.click(screen.getByRole('button', { name: /actions.cancel/i }))
    await waitFor(() => {
      expect(history.location.pathname).toEqual('/patients')
    })
  })
})
