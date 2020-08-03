'use strict'

import parsingService from '../../services/parsing-service'
import fs from 'fs'
import path from 'path'

/* global __fixturesDir */

describe('Parsing Service', () => {
  describe('parseDocument', () => {
    it('should parse an HTML document and spit out the searchable text', async () => {
      const htmlDocument = fs.readFileSync(path.join(__fixturesDir, 'mock-document.html'), 'utf-8')
      const searchObject = await parsingService.parseDocument(htmlDocument)

      expect(searchObject).not.toBeUndefined()
      expect(searchObject.path).not.toBeNull()
      expect(searchObject.title).toEqual('My Title')
      expect(searchObject.description).toEqual('My Title™ site description.')
      expect(searchObject.body).not.toBeNull()
      expect(searchObject.body.indexOf('University of Nebraska–Lincoln student and part-time')).not.toEqual(-1)
      expect(searchObject.image_url).toEqual('https://mysite.com/og/default.png')
      expect(searchObject.published_date).not.toBeNull()
    })
  })
})
