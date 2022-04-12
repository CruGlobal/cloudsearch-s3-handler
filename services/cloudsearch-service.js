'use strict'

import rollbar from '../config/rollbar'
import AWS from 'aws-sdk'
import crypto from 'crypto'

const MAX_ID_SIZE = 128
const cloudsearch = new AWS.CloudSearchDomain({ endpoint: process.env.CLOUDSEARCH_DOCUMENT_ENDPOINT })

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
 * @param searchDocuments an array of search documents to send to CloudSearch
 */
const sendToCloudsearch = async (searchDocuments) => {
  const cloudsearchRequest = {
    contentType: 'application/json',
    documents: JSON.stringify(searchDocuments)
  }

  const data = await cloudsearch.uploadDocuments(cloudsearchRequest).promise()
  if (data.warnings) {
    data.warnings.map(warning =>
      rollbar.warn(`Warning from batch upload: ${warning.message}`)
    )
  }
  return `Added ${data.adds} documents.`
}

/**
 * Sends the already-parsed data to CloudSearch.
 *
 * @param searchObject an object with all the desired fields to send to CloudSearch
 */
const sendSingleItemToCloudsearch = async (searchObject) => {
  const searchDocument = [{
    id: buildId(searchObject.path),
    type: 'add',
    fields: searchObject
  }]

  return sendToCloudsearch(searchDocument)
}

/**
 * Sends a batch of already-parsed data to CloudSearch.
 *
 * @param searchObjects an array of objects with all the desired fields to send to CloudSearch
 */
const sendBatchToCloudSearch = async (searchObjects) => {
  const searchDocument = []
  searchObjects.map(searchObject =>
    searchDocument.push({
      id: buildId(searchObject.path),
      type: 'add',
      fields: searchObject
    })
  )

  return sendToCloudsearch(searchDocument)
}

export default {
  sendSingleItemToCloudsearch,
  sendBatchToCloudSearch,
  buildId
}
