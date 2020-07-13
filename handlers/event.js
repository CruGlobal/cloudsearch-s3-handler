'use strict'

import rollbar from '../config/rollbar'

const AWS = require('aws-sdk')
const s3 = new AWS.S3()

export const handler = async (lambdaEvent) => {
  const parseDocument = async (document) => {
    // TODO: Implement
  }

  const sendToCloudsearch = async (searchObject) => {
    // TODO: Implement
  }

  const handleDocument = async (document) => {
    // TODO: Implement
    const searchObject = await parseDocument(document)
    await sendToCloudsearch(searchObject)
  }

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
