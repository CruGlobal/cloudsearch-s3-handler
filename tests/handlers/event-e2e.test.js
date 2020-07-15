'use strict'

import eventHandler from '../../handlers/event'
import fs from 'fs'
import path from 'path'

/* global __fixturesDir */

jest.mock('../../config/rollbar')
jest.unmock('aws-sdk')

describe('Event Handler End to End', () => {
  xit('handles a simple html file', async () => {
    const lambdaEvent = JSON.parse(fs.readFileSync(path.join(__fixturesDir, 'mock-s3-event.json'), 'utf-8'))
    lambdaEvent['Records'][0].s3.bucket.name = process.env['BUCKET']
    lambdaEvent['Records'][0].s3.bucket.arn = `arn:aws:s3:::${process.env['BUCKET']}`
    lambdaEvent['Records'][0].s3.object.key = 'index.html'

    jest.spyOn(eventHandler, 'sendToCloudsearch').mockImplementation(() => {})

    expect.assertions(1)
    const response = await eventHandler.handler(lambdaEvent)
    expect(response).toEqual('true')
  })
})
