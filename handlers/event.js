'use strict'

import rollbar from '../config/rollbar'
import AWS from 'aws-sdk'
import crypto from 'crypto'

const MAX_ID_SIZE = 128

const s3 = new AWS.S3()
const cloudsearch = new AWS.CloudSearchDomain({ endpoint: process.env['CLOUDSEARCH_DOMAIN_ARN'] })

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
  const searchDocument = {
    id: buildId(searchObject.path),
    type: 'add',
    fields: searchObject
  }
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

/**
 * Parses the S3 document into the fields we care about for CloudSearch.
 * @param document an object from S3 with metadata and HTTP response data
 * @returns the parsed data as an object
 */
const parseDocument = async (document) => {
  // TODO: Implement
  return document
}

/**
 * Handles an incoming S3 response (from s3.getObject()).
 */
const handleDocument = async (document) => {
  // TODO: Implement
  if (document.ContentType === 'text/html') {
    const searchObject = await parseDocument(document)
    await sendToCloudsearch(searchObject)
  }
}

const handler = async (lambdaEvent) => {
  try {
    const srcBucket = lambdaEvent['Records'][0].s3.bucket.name
    const srcKey = decodeURIComponent(lambdaEvent.Records[0].s3.object.key.replace(/\+/g, ' '))

    const params = {
      Bucket: srcBucket,
      Key: srcKey
    }

    let document = await s3.getObject(params).promise()
    await handleDocument(document)
    return 'true'
  } catch (error) {
    await rollbar.error('handler error', error, { lambdaEvent })
    throw error
  }
}

module.exports = {
  handler: handler,
  handleDocument: handleDocument,
  parseDocument: parseDocument,
  sendToCloudsearch: sendToCloudsearch,
  buildId: buildId
}
