'use strict'

import * as eventHandler from '../../handlers/event'
import parsingService from '../../services/parsing-service'
import fs from 'fs'
import path from 'path'

/* global __fixturesDir */

jest.mock('../../config/rollbar')
jest.unmock('aws-sdk')

describe('Event Handler End to End', () => {
  xit('handles a simple html file', async () => {
    const lambdaEvent = JSON.parse(fs.readFileSync(path.join(__fixturesDir, 'mock-s3-event.json'), 'utf-8'))
    lambdaEvent['Records'][0].s3.bucket.name = process.env['S3_BUCKET_NAME']
    lambdaEvent['Records'][0].s3.bucket.arn = `arn:aws:s3:::${process.env['S3_BUCKET_NAME']}`
    lambdaEvent['Records'][0].s3.object.key = 'index.html'

    jest.spyOn(parsingService, 'parseDocument').mockImplementation(() => Promise.resolve({
      path: 'https://some-site.com/page',
      title: 'My Title',
      body: 'staff member aims to guide a wave of incoming students toward transformation',
      'published_date': '2020-07-06T19:27:03.000Z'
    }))

    expect.assertions(1)
    const response = await eventHandler.handler(lambdaEvent)
    expect(response).toEqual('true')
  })
})
