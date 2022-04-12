'use strict'

import rollbar from '../config/rollbar'
import AWS from 'aws-sdk'
import cloudsearchService from '../services/cloudsearch-service'
import parsingService from '../services/parsing-service'

const s3 = new AWS.S3()

/**
 * Handles an incoming S3 response (from s3.getObject()).
 */
const handleDocument = async (document, srcKey) => {
  if (document.ContentType === 'text/html') {
    const searchObject = await parsingService.parseDocument(document.Body.toString(), srcKey)
    await cloudsearchService.sendSingleItemToCloudsearch(searchObject)
  }
}

const handler = async (lambdaEvent) => {
  try {
    const srcBucket = lambdaEvent.Records[0].s3.bucket.name
    const srcKey = decodeURIComponent(lambdaEvent.Records[0].s3.object.key.replace(/\+/g, ' '))

    const params = {
      Bucket: srcBucket,
      Key: srcKey
    }

    const document = await s3.getObject(params).promise()
    await handleDocument(document, srcKey)
    return 'true'
  } catch (error) {
    await rollbar.error('handler error', error, { lambdaEvent })
    throw error
  }
}

export default {
  handler,
  handleDocument
}
