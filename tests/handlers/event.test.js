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
      console.log(JSON.stringify(rollbar))
      expect(rollbar.error).toHaveBeenCalled()
      done()
    })
  })
})
