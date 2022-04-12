'use strict'

import cheerio from 'cheerio'

/**
 * Parses the S3 document into the fields we care about for CloudSearch.
 * @param document an object from S3 with metadata and HTTP response data
 * @param srcKey the path to the HTML file we want to parse
 * @returns the parsed data as an object
 */
const parseDocument = async (document, srcKey) => {
  const $ = cheerio.load(document)
  const body = $('body').text().replace(/\s\s+/g, ' ')
  const title = $('meta[property="og:title"]').attr('content')
  const description = $('meta[property="og:description"]').attr('content')
  const imageUrl = $('meta[property="og:image"]').attr('content')
  const publishedDate = new Date().toISOString()
  const path = buildPath(srcKey)

  return {
    path: path,
    title: title,
    description: description,
    has_description: description ? 1 : 0,
    body: body,
    image_url: imageUrl,
    published_date: publishedDate,
    path_literal: path
  }
}

const buildPath = (srcKey) => {
  const positionOfIndex = srcKey.indexOf('index.html')
  if (positionOfIndex === 0) {
    return process.env.SITE_URL
  } else if (positionOfIndex !== -1) {
    return `${process.env.SITE_URL}/${srcKey.substring(0, positionOfIndex - 1)}`
  } else {
    return `${process.env.SITE_URL}/${srcKey}`
  }
}

export default {
  parseDocument,
  buildPath
}
