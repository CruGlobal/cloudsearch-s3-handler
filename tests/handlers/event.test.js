'use strict'

import rollbar from '../../config/rollbar'
import eventHandler, { handler, buildId, sendToCloudsearch } from '../../handlers/event'
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

  it('skips an image', async () => {
    jest.spyOn(eventHandler, 'sendToCloudsearch').mockImplementation(() => {})
    jest.spyOn(eventHandler, 'parseDocument').mockImplementation(() => {})

    lambdaEvent.Records[0].s3.object.key = 'image'

    expect.assertions(2)
    await eventHandler.handler(lambdaEvent)
    expect(eventHandler.parseDocument).not.toHaveBeenCalled()
    expect(eventHandler.sendToCloudsearch).not.toHaveBeenCalled()
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

  it('should throw an error if there is a problem uploading the search document', done => {
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

  describe('buildId', () => {
    it('should hash the id before sending to CloudSearch if it is too long', () => {
      const pageUrl = 'https://some-site.com/path/which-is/super-long/and/has-to-be-hashed/lorem-ipsum-dolor-sit-amet-consectetur-adipiscing-elit-sed-do.html'

      const id = buildId(pageUrl)
      expect(id).not.toEqual(pageUrl)
    })
  })

  describe('sendToCloudSearch', () => {
    it('should send warnings to Rollbar if there are warnings', async () => {
      const searchObject = {
        path: 'warnings'
      }
      expect.assertions(1)
      await sendToCloudsearch(searchObject)
      expect(rollbar.warn).toHaveBeenCalledWith('Warning from batch upload: Warning!')
    })

    it('should send a warning to Rollbar if the successful adds is not 1', async () => {
      const searchObject = {
        path: 'adds'
      }
      expect.assertions(1)
      await sendToCloudsearch(searchObject)
      expect(rollbar.warn).toHaveBeenCalledWith('We sent 1 add document, but 2 documents were added.')
    })
  })
})
