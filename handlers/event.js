'use strict'

import rollbar from '../config/rollbar'
import AWS from 'aws-sdk'
import crypto from 'crypto'

const MAX_ID_SIZE = 128

const s3 = new AWS.S3()
const cloudsearch = new AWS.CloudSearchDomain({ endpoint: process.env['CLOUDSEARCH_DOMAIN_ARN'] })

export const handler = async (lambdaEvent) => {
  const parseDocument = async (document) => {
    // TODO: Implement
    return {
      path: 'https://some-site.com/path.html'
    }
  }

  const buildId = (pageUrl) => {
    if (pageUrl.length > MAX_ID_SIZE) {
      let id = pageUrl
      id = crypto.createHash('md5').update(id).digest('hex')
      return id
    }
    return pageUrl
  }

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
