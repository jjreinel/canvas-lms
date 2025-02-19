/*
 * Copyright (C) 2021 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react'
import {MockedProvider} from '@apollo/react-testing'
import {act, render as rtlRender, fireEvent} from '@testing-library/react'
import FindOutcomesModal from '../FindOutcomesModal'
import OutcomesContext from '@canvas/outcomes/react/contexts/OutcomesContext'
import {createCache} from '@canvas/apollo'
import * as FlashAlert from '@canvas/alerts/react/FlashAlert'
import {findModalMocks} from '@canvas/outcomes/mocks/Outcomes'
import {findOutcomesMocks} from '@canvas/outcomes/mocks/Management'

jest.useFakeTimers()

describe('FindOutcomesModal', () => {
  let cache
  let onCloseHandlerMock
  let showFlashAlertSpy
  const defaultProps = (props = {}) => ({
    open: true,
    onCloseHandler: onCloseHandlerMock,
    ...props
  })

  beforeEach(() => {
    onCloseHandlerMock = jest.fn()
    cache = createCache()
    showFlashAlertSpy = jest.spyOn(FlashAlert, 'showFlashAlert')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const render = (
    children,
    {contextType = 'Account', contextId = '1', mocks = findModalMocks(), renderer = rtlRender} = {}
  ) => {
    return renderer(
      <OutcomesContext.Provider value={{env: {contextType, contextId}}}>
        <MockedProvider cache={cache} mocks={mocks}>
          {children}
        </MockedProvider>
      </OutcomesContext.Provider>
    )
  }

  it('renders component with "Add Outcomes to Account" title when contextType is Account', async () => {
    const {getByText} = render(<FindOutcomesModal {...defaultProps()} />)
    await act(async () => jest.runAllTimers())
    expect(getByText('Add Outcomes to Account')).toBeInTheDocument()
  })

  it('debounces the search string entered by the user', async () => {
    const {getByText, getByLabelText} = render(<FindOutcomesModal {...defaultProps()} />, {
      mocks: [...findModalMocks(), ...findOutcomesMocks()]
    })
    await act(async () => jest.runAllTimers())
    fireEvent.click(getByText('Account Standards'))
    fireEvent.click(getByText('Root Account Outcome Group 0'))
    await act(async () => jest.runAllTimers())
    expect(getByText('25 Outcomes')).toBeInTheDocument()
    const input = getByLabelText('Search field')
    fireEvent.change(input, {target: {value: 'mathemati'}})
    await act(async () => jest.advanceTimersByTime(100))
    expect(getByText('25 Outcomes')).toBeInTheDocument()
    fireEvent.change(input, {target: {value: 'mathematic'}})
    await act(async () => jest.advanceTimersByTime(300))
    expect(getByText('25 Outcomes')).toBeInTheDocument()
    fireEvent.change(input, {target: {value: 'mathematics'}})
    await act(async () => jest.advanceTimersByTime(500))
    expect(getByText('15 Outcomes')).toBeInTheDocument()
  })

  it('should not disable search input and clear search button if there are no results', async () => {
    const {getByText, getByLabelText, queryByTestId} = render(
      <FindOutcomesModal {...defaultProps()} />,
      {
        mocks: [...findModalMocks(), ...findOutcomesMocks()]
      }
    )
    await act(async () => jest.runAllTimers())
    fireEvent.click(getByText('Account Standards'))
    fireEvent.click(getByText('Root Account Outcome Group 0'))
    await act(async () => jest.runAllTimers())
    expect(getByText('25 Outcomes')).toBeInTheDocument()
    const input = getByLabelText('Search field')
    fireEvent.change(input, {target: {value: 'no results'}})
    await act(async () => jest.advanceTimersByTime(500))
    expect(getByLabelText('Search field')).toBeEnabled()
    expect(queryByTestId('clear-search-icon')).toBeInTheDocument()
  })

  it('renders component with "Add Outcomes to Course" title when contextType is Course', async () => {
    const {getByText} = render(<FindOutcomesModal {...defaultProps()} />, {
      contextType: 'Course'
    })
    await act(async () => jest.runAllTimers())
    expect(getByText('Add Outcomes to Course')).toBeInTheDocument()
  })

  it('shows modal if open prop true', async () => {
    const {getByText} = render(<FindOutcomesModal {...defaultProps()} />)
    await act(async () => jest.runAllTimers())
    expect(getByText('Close')).toBeInTheDocument()
  })

  it('does not show modal if open prop false', async () => {
    const {queryByText} = render(<FindOutcomesModal {...defaultProps({open: false})} />)
    await act(async () => jest.runAllTimers())
    expect(queryByText('Close')).not.toBeInTheDocument()
  })

  it('calls onCloseHandlerMock on Close button click', async () => {
    const {getByText} = render(<FindOutcomesModal {...defaultProps()} />)
    await act(async () => jest.runAllTimers())
    const closeBtn = getByText('Close')
    fireEvent.click(closeBtn)
    expect(onCloseHandlerMock).toHaveBeenCalledTimes(1)
  })

  it('calls onCloseHandlerMock on Done button click', async () => {
    const {getByText} = render(<FindOutcomesModal {...defaultProps()} />)
    await act(async () => jest.runAllTimers())
    const doneBtn = getByText('Done')
    fireEvent.click(doneBtn)
    expect(onCloseHandlerMock).toHaveBeenCalledTimes(1)
  })

  it('clears selected outcome group on modal close', async () => {
    const {getByText, queryByText, rerender} = render(<FindOutcomesModal {...defaultProps()} />)
    await act(async () => jest.runAllTimers())
    fireEvent.click(getByText('Account Standards'))
    fireEvent.click(getByText('Root Account Outcome Group 0'))
    await act(async () => jest.runAllTimers())
    expect(getByText('Add All Outcomes')).toBeInTheDocument()
    fireEvent.click(getByText('Done'))
    render(<FindOutcomesModal {...defaultProps({open: false})} />, {renderer: rerender})
    await act(async () => jest.runAllTimers())
    render(<FindOutcomesModal {...defaultProps()} />, {renderer: rerender})
    await act(async () => jest.runAllTimers())
    expect(queryByText('Add All Outcomes')).not.toBeInTheDocument()
  })

  describe('within an account context', () => {
    it('renders the parent account groups', async () => {
      const {getByText} = render(<FindOutcomesModal {...defaultProps()} />)
      await act(async () => jest.runAllTimers())
      expect(getByText('100 Groups | 0 Outcomes')).toBeInTheDocument()
      fireEvent.click(getByText('Account Standards'))
      await act(async () => jest.runAllTimers())
      expect(getByText('Root Account Outcome Group 0')).toBeInTheDocument()
    })

    it('displays an error on failed request', async () => {
      render(<FindOutcomesModal {...defaultProps()} />, {mocks: []})
      await act(async () => jest.runAllTimers())
      expect(showFlashAlertSpy).toHaveBeenCalledWith({
        message: 'An error occurred while loading account outcomes.',
        type: 'error'
      })
    })
  })

  describe('within a course context', () => {
    it('renders the course.account group and parent account groups', async () => {
      const {getByText} = render(<FindOutcomesModal {...defaultProps()} />, {
        contextType: 'Course'
      })
      await act(async () => jest.runAllTimers())
      fireEvent.click(getByText('Account Standards'))
      await act(async () => jest.runAllTimers())
      expect(getByText(`Course Account Outcome Group`)).toBeInTheDocument()
      expect(getByText('Root Account Outcome Group 0')).toBeInTheDocument()
    })

    it('displays an error on failed request', async () => {
      render(<FindOutcomesModal {...defaultProps()} />, {
        contextType: 'Course',
        mocks: []
      })
      await act(async () => jest.runAllTimers())
      expect(showFlashAlertSpy).toHaveBeenCalledWith({
        message: 'An error occurred while loading course outcomes.',
        type: 'error'
      })
    })
  })

  describe('global standards', () => {
    beforeEach(() => {
      window.ENV = {
        GLOBAL_ROOT_OUTCOME_GROUP_ID: 1
      }
    })

    afterEach(() => {
      window.ENV = null
    })

    it('renders the State Standards group and subgroups', async () => {
      const {getByText} = render(<FindOutcomesModal {...defaultProps()} />, {
        mocks: findModalMocks({includeGlobalRootGroup: true})
      })
      await act(async () => jest.runAllTimers())
      expect(getByText('20 Groups | 5 Outcomes')).toBeInTheDocument()
      fireEvent.click(getByText('State Standards'))
      await act(async () => jest.runAllTimers())
    })

    it('does not render the State Standard group if no GLOBAL_ROOT_OUTCOME_GROUP_ID is set', async () => {
      window.ENV.GLOBAL_ROOT_OUTCOME_GROUP_ID = ''
      const {queryByText} = render(<FindOutcomesModal {...defaultProps()} />, {
        mocks: findModalMocks({includeGlobalRootGroup: true})
      })
      await act(async () => jest.runAllTimers())
      expect(queryByText('State Standards')).not.toBeInTheDocument()
    })
  })
})
