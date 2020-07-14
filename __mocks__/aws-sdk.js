/**
 * Modified from https://derikwhittaker.blog/2018/02/20/using-manual-mocks-to-test-the-aws-sdk-with-jest/
 */
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
      // Note: this is not a realistic response, but will make testing easier until the parsing is done
      // TODO: Rework when parsing logic is complete
      return {
        promise: () => Promise.resolve({
          path: 'fail'
        })
      }
    } else if (params.Key === 'longUrl') {
      return {
        promise: () => Promise.resolve({
          path: 'https://some-site.com/path/which-is/super-long/and/has-to-be-hashed/lorem-ipsum-dolor-sit-amet-consectetur-adipiscing-elit-sed-do.html'
        })
      }
    } else if (params.Key === 'warnings') {
      return {
        promise: () => Promise.resolve({
          path: 'warnings'
        })
      }
    } else if (params.Key === 'adds') {
      return {
        promise: () => Promise.resolve({
          path: 'adds'
        })
      }
    } else {
      return {
        promise: () => Promise.resolve({
          path: 'https://some-site.com/path.html'
        })
      }
    }
  }
}

AWS.CloudSearchDomain = function (endpoint) {
  this.endpoint = endpoint
}

AWS.CloudSearchDomain.prototype = {
  ...AWS.CloudSearchDomain.prototype,

  uploadDocuments: (params, callback) => {
    if (params.contentType) {
      if (params.contentType !== 'application/json' && params.contentType !== 'application/xml') {
        callback(new Error('Invalid content type'))
      }
    } else {
      callback(new Error('Content type is required'))
    }

    if (params.documents) {
      const document = JSON.parse(params.documents)
      if (document.id === 'fail') {
        callback(new Error('Error for the purpose of unit testing'))
      } else if (document.id === 'warnings') {
        const successResponse = {
          status: 'Success With Warnings',
          adds: 1,
          deletes: 0,
          warnings: [{ message: 'Warning!' }]
        }
        callback(null, successResponse)
      } else if (document.id === 'adds') {
        const successResponse = {
          status: 'Success With Too Many Adds',
          adds: 2,
          deletes: 0,
          warnings: []
        }
        callback(null, successResponse)
      } else if (document.id.indexOf('http') === -1) {
        const successResponse = {
          status: 'Successful Hashed',
          adds: 1,
          deletes: 0
        }
        callback(null, successResponse)
      } else {
        const successResponse = {
          status: 'Success',
          adds: 1,
          deletes: 0,
          warnings: []
        }
        callback(null, successResponse)
      }
    }
  }
}

// Export my AWS function so it can be referenced via requires
module.exports = AWS
