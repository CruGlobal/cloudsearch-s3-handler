'use strict'

import rollbar from '../config/rollbar'
import AWS from 'aws-sdk'
import cloudsearchService from '../services/cloudsearch-service'
import parsingService from '../services/parsing-service'

const s3 = new AWS.S3()

/**
 * Handles an incoming S3 response (from s3.getObject()).
 */
const handleDocument = async (document) => {
  // TODO: Implement
  if (document.ContentType === 'text/html') {
    const searchObject = await parsingService.parseDocument(document)
    await cloudsearchService.sendSingleItemToCloudsearch(searchObject)
  }
}

export const handler = async (lambdaEvent) => {
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
  handleDocument: handleDocument
}
