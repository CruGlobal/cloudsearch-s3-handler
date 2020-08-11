require('dotenv').config()
const aws = require('aws-sdk');

(async function () {
  try {
    aws.config.setPromisesDependency()

    aws.config.update({
      accessKeyId: process.env.ACCESS,
      secretAccessKey: process.env.SECRET,
      region: 'us-east-1'
    })

    const s3 = new aws.S3()
    const response = await s3.listObjectsV2({
      Bucket: process.env['S3_BUCKET_NAME']
    }).promise()

    console.log(response)
  } catch (e) {
    console.log('our error', e)
  }

  console.log(`Access: ${process.env.ACCESS}`)
  console.log(`Secret: ${process.env.SECRET}`)
  console.log(`Bucket: ${process.env['S3_BUCKET_NAME']}`)
})()
