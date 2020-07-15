'use strict'

import rollbar from '../config/rollbar'
import AWS from 'aws-sdk'
import crypto from 'crypto'

const MAX_ID_SIZE = 128
const cloudsearch = new AWS.CloudSearchDomain({ endpoint: process.env['CLOUDSEARCH_DOCUMENT_ENDPOINT'] })

/**
 * Returns either the page URL or an MD5 hashed ID if the URL is longer than 128 characters.
 */
const buildId = (pageUrl) => {
  if (pageUrl.length > MAX_ID_SIZE) {
    let id = pageUrl
    id = crypto.createHash('md5').update(id).digest('hex')
    return id
  }
  return pageUrl
}

/**
 * Sends the already-parsed data to CloudSearch.
 *
 * @param searchObject an object with all the desired fields to send to CloudSearch
 * @returns {Promise<void>}
 */
const sendToCloudsearch = async (searchObject) => {
  const searchDocument = [{
    id: buildId(searchObject.path),
    type: 'add',
    fields: searchObject
  }]
  const cloudsearchRequest = {
    contentType: 'application/json',
    documents: JSON.stringify(searchDocument)
  }

  cloudsearch.uploadDocuments(cloudsearchRequest, (err, data) => {
    if (err) {
      throw err
    }
    if (data.warnings) {
      data.warnings.map(warning => {
        rollbar.warn(`Warning from batch upload: ${warning.message}`)
      })
    }
    if (data.adds !== 1) {
      rollbar.warn(`We sent 1 add document, but ${data.adds} documents were added.`)
    }
    return `Added ${data.adds} documents.`
  })
}

module.exports = {
  sendToCloudsearch: sendToCloudsearch,
  buildId: buildId
}
