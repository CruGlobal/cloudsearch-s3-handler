'use strict'

import rollbar from '../../config/rollbar'
import * as eventHandler from '../../handlers/event'
import cloudsearchService from '../../services/cloudsearch-service'
import parsingService from '../../services/parsing-service'
import fs from 'fs'
import path from 'path'

/* global __fixturesDir */

jest.mock('../../config/rollbar')
jest.mock('aws-sdk')

describe('Event eventHandler.handler', () => {
  let lambdaEvent
  beforeEach(() => {
    lambdaEvent = JSON.parse(fs.readFileSync(path.join(__fixturesDir, 'mock-s3-event.json'), 'utf-8'))
  })

  it('is defined', () => {
    expect(eventHandler.handler).toBeDefined()
  })

  it('handles a simple html file', async () => {
    expect.assertions(1)
    const response = await eventHandler.handler(lambdaEvent)
    expect(response).toEqual('true')
  })

  it('skips an image', async () => {
    jest.spyOn(cloudsearchService, 'sendSingleItemToCloudsearch').mockImplementation(() => {})
    jest.spyOn(parsingService, 'parseDocument').mockImplementation(() => {})

    lambdaEvent.Records[0].s3.object.key = 'image'

    expect.assertions(2)
    await eventHandler.handler(lambdaEvent)
    expect(parsingService.parseDocument).not.toHaveBeenCalled()
    expect(cloudsearchService.sendSingleItemToCloudsearch).not.toHaveBeenCalled()
  })

  it('logs to rollbar in case of an error', done => {
    lambdaEvent.Records[0].s3.object.key = 'fail'

    eventHandler.handler(lambdaEvent).then(() => {
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
})
