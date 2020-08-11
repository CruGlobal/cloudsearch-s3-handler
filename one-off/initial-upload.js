'use strict'

import AWS from 'aws-sdk'
import cloudsearchService from '../services/cloudsearch-service'
import parsingService from '../services/parsing-service'
const s3 = new AWS.S3()

const listObjects = async (continuationToken, s3Bucket) => {
  if (continuationToken) {
    return s3.listObjectsV2({
      Bucket: s3Bucket,
      ContinuationToken: continuationToken
    }).promise()
  } else {
    return s3.listObjectsV2({ Bucket: s3Bucket }).promise()
  }
}

const handleContents = async (listObjectResponse, lastIndex) => {
  if (!listObjectResponse.Contents) {
    throw new Error(`Empty Contents: ${JSON.stringify(listObjectResponse)}`)
  }

  let i
  const batch = []
  for (i = 0; i < listObjectResponse.Contents.length; i++) {
    const document = listObjectResponse.Contents[i]
    if (document.Key.endsWith('.html')) {
      const params = {
        Bucket: process.env['S3_BUCKET_NAME'],
        Key: document.Key
      }
      const realDocument = await s3.getObject(params).promise()
      const parsed = await parsingService.parseDocument(realDocument.Body.toString(), document.Key)
      batch.push(parsed)
      console.log(`${i + lastIndex}: ${document.Key}`)
    } else {
      console.log(`Skipping ${i + lastIndex}: ${document.Key}`)
    }
  }

  await cloudsearchService.sendBatchToCloudSearch(batch)

  if (listObjectResponse.IsTruncated) {
    const paginatedResponse = await listObjects(listObjectResponse.NextContinuationToken)
    await handleContents(paginatedResponse, i + lastIndex)
  }
}

module.exports = async (s3Bucket) => {
  try {
    const listObjectResponse = await listObjects(null, s3Bucket || process.env['S3_BUCKET_NAME'])
    await handleContents(listObjectResponse, 0)
  } catch (e) {
    console.error(e)
    throw e
  }
}
