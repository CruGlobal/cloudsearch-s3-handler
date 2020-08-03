'use strict'

import cheerio from 'cheerio'

/**
 * Parses the S3 document into the fields we care about for CloudSearch.
 * @param document an object from S3 with metadata and HTTP response data
 * @returns the parsed data as an object
 */
const parseDocument = async (document) => {
  const $ = cheerio.load(document)
  const body = $('body').text().replace(/\s\s+/g, ' ')
  const title = $('meta[property="og:title"]').attr('content')
  const description = $('meta[property="og:description"]').attr('content')
  const imageUrl = $('meta[property="og:image"]').attr('content')
  const publishedDate = new Date().toISOString()

  // TODO: How to get path since canonical url does not necessarily exist on the page?
  const path = process.env['SITE_URL']

  return {
    path: path,
    title: title,
    description: description,
    body: body,
    'image_url': imageUrl,
    'published_date': publishedDate
  }
}

module.exports = {
  parseDocument: parseDocument
}
