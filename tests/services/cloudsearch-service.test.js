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

  describe('sendToCloudSearch', () => {
    it('should send warnings to Rollbar if there are warnings', async () => {
      const searchObject = {
        path: 'warnings'
      }
      expect.assertions(1)
      await cloudsearchService.sendToCloudsearch(searchObject)
      expect(rollbar.warn).toHaveBeenCalledWith('Warning from batch upload: Warning!')
    })

    it('should send a warning to Rollbar if the successful adds is not 1', async () => {
      const searchObject = {
        path: 'adds'
      }
      expect.assertions(1)
      await cloudsearchService.sendToCloudsearch(searchObject)
      expect(rollbar.warn).toHaveBeenCalledWith('We sent 1 add document, but 2 documents were added.')
    })

    it('should throw an error if there is a problem uploading the search document', done => {
      const searchObject = {
        path: 'fail'
      }

      cloudsearchService.sendToCloudsearch(searchObject).then(() => {
        done.fail('Should have thrown an error')
      }).catch((err) => {
        expect(err).toEqual(new Error('Error for the purpose of unit testing'))
        done()
      })
    })
  })
})
