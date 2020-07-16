'use strict'

/*
 * This is not really a test, it's just a way to easily run initial-upload as a module.
 */

import uploader from '../../one-off/initial-upload'

jest.mock('../../config/rollbar')
jest.unmock('aws-sdk')
jest.setTimeout(300000) // 5 minute timeout

describe('Initial Upload', () => {
  xit('Uploads all of the HTML pages from an S3 bucket', async () => {
    await uploader()
  })
})
