'use strict'

import uploader from '../../one-off/initial-upload'
import cloudsearchService from '../../services/cloudsearch-service'
import parsingService from '../../services/parsing-service'

jest.mock('../../config/rollbar')
// jest.unmock('aws-sdk')

describe('Initial Upload', () => {
  /**
   * This is not really a test, it's just a way to easily run initial-upload as a module.
   */
  describe('Actual upload', () => {
    xit('uploads all of the HTML pages from an S3 bucket', async () => {
      // In order for this to work, uncomment jest.unmock('aws-sdk') above
      jest.setTimeout(300000) // 5 minute timeout
      await uploader()
    })
  })

  describe('Tests', () => {
    beforeEach(() => {
      jest.mock('aws-sdk') // mock for testing
      jest.setTimeout(5000) // back to the default for testing
    })

    it('sends all of the HTML pages to CloudSearch', async () => {
      const mockParsed = {
        title: 'My Title',
        body: 'staff member aims to guide a wave of incoming students toward transformation',
        'published_date': '2020-07-06T19:27:03.000Z'
      }

      jest.spyOn(cloudsearchService, 'sendBatchToCloudSearch').mockImplementation(() => {})
      jest.spyOn(parsingService, 'parseDocument').mockImplementation(document => {
        mockParsed.path = document.path
        return Promise.resolve(mockParsed)
      })

      expect.assertions(4)
      await uploader()

      expect(parsingService.parseDocument).toHaveBeenCalledTimes(2)
      expect(cloudsearchService.sendBatchToCloudSearch).toHaveBeenCalledTimes(2)

      mockParsed.path = 'https://some-site.com/page.html'
      const firstExpectedBatch = [ mockParsed ]
      expect(cloudsearchService.sendBatchToCloudSearch).toHaveBeenCalledWith(firstExpectedBatch)

      mockParsed.path = 'https://some-site.com/another-page.html'
      const secondExpectedBatch = [ mockParsed ]
      expect(cloudsearchService.sendBatchToCloudSearch).toHaveBeenCalledWith(secondExpectedBatch)
    })

    it('should throw an error if there is a failure listing the objects in S3', async () => {
      expect.assertions(1)
      try {
        await uploader('fail')
      } catch (err) {
        expect(err).toEqual(new Error('Failure for unit test'))
      }
    })

    it('should throw an error if listing the objects gives empty contents', async () => {
      expect.assertions(1)
      try {
        await uploader('empty')
      } catch (err) {
        expect(err).toEqual(new Error(`Empty Contents: ${JSON.stringify({})}`))
      }
    })
  })
})
