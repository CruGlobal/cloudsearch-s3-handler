'use strict'

import cloudsearchService from '../../services/cloudsearch-service'
import rollbar from '../../config/rollbar'

jest.mock('../../config/rollbar')
jest.mock('aws-sdk')

describe('CloudSearch Service', () => {
  describe('buildId', () => {
    it('should hash the id before sending to CloudSearch if it is too long', () => {
      const pageUrl = 'https://some-site.com/path/which-is/super-long/and/has-to-be-hashed/lorem-ipsum-dolor-sit-amet-consectetur-adipiscing-elit-sed-do.html'

      const id = cloudsearchService.buildId(pageUrl)
      expect(id).not.toEqual(pageUrl)
    })
  })

  describe('sendSingleItemToCloudsearch', () => {
    it('should send warnings to Rollbar if there are warnings', async () => {
      const searchObject = {
        path: 'warnings'
      }
      expect.assertions(1)
      await cloudsearchService.sendSingleItemToCloudsearch(searchObject)
      expect(rollbar.warn).toHaveBeenCalledWith('Warning from batch upload: Warning!')
    })

    it('should throw an error if there is a problem uploading the search document', done => {
      const searchObject = {
        path: 'fail'
      }

      cloudsearchService.sendSingleItemToCloudsearch(searchObject).then(() => {
        done.fail('Should have thrown an error')
      }).catch((err) => {
        expect(err).toEqual(new Error('Error for the purpose of unit testing'))
        done()
      })
    })
  })

  describe('sendBatchToCloudsearch', () => {
    it('should send a batch to CloudSearch', async () => {
      const searchObjects = [
        {
          path: 'adds'
        },
        {
          path: 'second-path'
        }
      ]
      expect.assertions(1)
      const response = await cloudsearchService.sendBatchToCloudSearch(searchObjects)
      expect(response).toEqual('Added 2 documents.')
    })
  })
})
