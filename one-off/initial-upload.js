'use strict'

import AWS from 'aws-sdk'
import cloudsearchService from '../services/cloudsearch-service'
import parsingService from '../services/parsing-service'
const s3 = new AWS.S3()

const listObjects = async (continuationToken) => {
  if (continuationToken) {
    return s3.listObjectsV2({
      Bucket: process.env['BUCKET'],
      ContinuationToken: continuationToken
    }).promise()
  } else {
    return s3.listObjectsV2({ Bucket: process.env['BUCKET'] }).promise()
  }
}

const handleContents = async (listObjectResponse, lastIndex) => {
  if (!listObjectResponse.Contents) {
    console.error(`Empty Contents: ${JSON.stringify(listObjectResponse)}`)
    return
  }

  let i
  let batch = []
  for (i = 0; i < listObjectResponse.Contents.length; i++) {
    let document = listObjectResponse.Contents[i]
    if (document.Key.endsWith('.html')) {
      const parsed = await parsingService.parseDocument(document)
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

module.exports = async () => {
  try {
    const listObjectResponse = await listObjects()
    await handleContents(listObjectResponse, 0)
  } catch (e) {
    console.error(e)
  }
}
