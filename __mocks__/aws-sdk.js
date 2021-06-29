/**
 * Modified from https://derikwhittaker.blog/2018/02/20/using-manual-mocks-to-test-the-aws-sdk-with-jest/
 */

import fs from 'fs'
import path from 'path'

/* global __fixturesDir */

const mockHtml = fs.readFileSync(path.join(__fixturesDir, 'mock-s3-event.json'))
const AWS = {}

// This here is to allow/prevent runtime errors if you are using
// AWS.config to do some runtime configuration of the library.
AWS.config = {
  setPromisesDependency: (arg) => {},
  update: (arg) => {}
}

AWS.S3 = function () {

}

// Because I care about using the S3 service's which are part of the SDK
// I need to setup the correct identifier.
AWS.S3.prototype = {
  ...AWS.S3.prototype,

  getObject: (params) => {
    if (params.Key === 'fail') {
      return {
        promise: () => Promise.reject(new Error('Failed to get object.'))
      }
    } else if (params.Key === 'uploadFail') {
      return {
        promise: () => Promise.resolve({
          path: 'fail',
          ContentType: 'text/html',
          Body: Buffer.from(mockHtml)
        })
      }
    } else if (params.Key === 'image') {
      return {
        promise: () => Promise.resolve({
          path: 'https://some-site.com/image.jpg',
          ContentType: 'image/jpeg'
        })
      }
    } else {
      return {
        promise: () => Promise.resolve({
          path: `https://some-site.com/${params.Key}`,
          ContentType: 'text/html',
          Body: Buffer.from(mockHtml)
        })
      }
    }
  },

  listObjectsV2: (params) => {
    const firstPage = {
      Contents: [
        {
          Key: 'image.jpg'
        },
        {
          Key: 'page.html'
        }
      ],
      NextContinuationToken: 'token',
      IsTruncated: true
    }

    const secondPage = {
      Contents: [
        {
          Key: 'img.png'
        },
        {
          Key: 'another-page.html'
        }
      ]
    }

    if (params.ContinuationToken) {
      return {
        promise: () => Promise.resolve(secondPage)
      }
    } else if (params.Bucket === 'fail') {
      return {
        promise: () => Promise.reject(new Error('Failure for unit test'))
      }
    } else if (params.Bucket === 'empty') {
      return {
        promise: () => Promise.resolve({})
      }
    } else {
      return {
        promise: () => Promise.resolve(firstPage)
      }
    }
  }
}

AWS.CloudSearchDomain = function (endpoint) {
  this.endpoint = endpoint
}

AWS.CloudSearchDomain.prototype = {
  ...AWS.CloudSearchDomain.prototype,

  uploadDocuments: (params) => {
    if (params.contentType) {
      if (params.contentType !== 'application/json' && params.contentType !== 'application/xml') {
        return {
          promise: () => Promise.reject(new Error('Invalid content type'))
        }
      }
    } else {
      return {
        promise: () => Promise.reject(new Error('Content type is required'))
      }
    }

    if (params.documents) {
      const documents = JSON.parse(params.documents)
      if (documents.length === 1) {
        const document = documents[0]
        if (document.id === 'fail') {
          return {
            promise: () => Promise.reject(new Error('Error for the purpose of unit testing'))
          }
        } else if (document.id === 'warnings') {
          const successResponse = {
            status: 'Success With Warnings',
            adds: 1,
            deletes: 0,
            warnings: [{ message: 'Warning!' }]
          }
          return {
            promise: () => Promise.resolve(successResponse)
          }
        } else {
          const successResponse = {
            status: 'Success',
            adds: 1,
            deletes: 0,
            warnings: []
          }
          return {
            promise: () => Promise.resolve(successResponse)
          }
        }
      } else if (documents.length > 1) {
        const successResponse = {
          status: 'Success With Multiple Adds',
          adds: 2,
          deletes: 0
        }
        return {
          promise: () => Promise.resolve(successResponse)
        }
      }
    }
  }
}

// Export my AWS function so it can be referenced via requires
export default AWS
