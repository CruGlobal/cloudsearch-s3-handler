'use strict'

import rollbar from '../../config/rollbar'
import { handler } from '../../handlers/event'
import fs from 'fs'
import path from 'path'

/* global __fixturesDir */

jest.mock('../../config/rollbar')
jest.mock('aws-sdk')

describe('Event Handler', () => {
  let lambdaEvent
  beforeEach(() => {
    lambdaEvent = JSON.parse(fs.readFileSync(path.join(__fixturesDir, 'mock-s3-event.json'), 'utf-8'))
  })

  it('is defined', () => {
    expect(handler).toBeDefined()
  })

  it('handles a simple html file', async () => {
    expect.assertions(1)
    const response = await handler(lambdaEvent)
    expect(response).toEqual('true')
  })

  it('logs to rollbar in case of an error', done => {
    lambdaEvent.Records[0].s3.object.key = 'fail'

    handler(lambdaEvent).then(() => {
      done.fail()
    }).catch(() => {
      expect(rollbar.error).toHaveBeenCalledWith(
        'handler error',
        new Error('Failed to get object.'),
        { lambdaEvent }
      )
      done()
    })
  })

  it('should throw an error', done => {
    lambdaEvent.Records[0].s3.object.key = 'uploadFail'

    handler(lambdaEvent).then(() => {
      done.fail()
    }).catch(() => {
      expect(rollbar.error).toHaveBeenCalledWith(
        'handler error',
        new Error('Error for the purpose of unit testing'),
        { lambdaEvent })
      done()
    })
  })

  it('should hash the id before sending to CloudSearch if it is too long', async () => {
    lambdaEvent.Records[0].s3.object.key = 'longUrl'

    expect.assertions(1)
    const response = await handler(lambdaEvent)
    expect(response).toEqual('true')
  })

  it('should send warnings to Rollbar if there are warnings', async () => {
    lambdaEvent.Records[0].s3.object.key = 'warnings'
    expect.assertions(2)
    const response = await handler(lambdaEvent)
    expect(response).toEqual('true')
    expect(rollbar.warn).toHaveBeenCalledWith('Warning from batch upload: Warning!')
  })

  it('should send a warning to Rollbar if the successful adds is not 1', async () => {
    lambdaEvent.Records[0].s3.object.key = 'adds'
    expect.assertions(2)
    const response = await handler(lambdaEvent)
    expect(response).toEqual('true')
    expect(rollbar.warn).toHaveBeenCalledWith('We sent 1 add document, but 2 documents were added.')
  })
})
