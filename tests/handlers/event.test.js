'use strict'

const eventHandler = require('../../handlers/event')
const fs = require('fs')
const path = require('path')

/* global __fixturesDir */

jest.mock('../../config/rollbar')

describe('Event Handler', () => {
  it('is defined', () => {
    expect(eventHandler).toBeDefined()
  })

  it('handles a simple html file', async () => {
    const lambdaEvent = JSON.parse(fs.readFileSync(path.join(__fixturesDir, 'mock-s3-event.json'), 'utf-8'))

    lambdaEvent.Records[0].s3.bucket.name = process.env['BUCKET']
    lambdaEvent.Records[0].s3.bucket.arn = `arn:aws:s3:::${process.env['BUCKET']}`

    expect.assertions(1)
    const response = await eventHandler.handler(lambdaEvent)
    expect(response).toEqual('true')
  })
})
