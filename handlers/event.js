'use strict'

import rollbar from '../config/rollbar'

export const handler = async (lambdaEvent) => {
  try {
    return "true"
  } catch (error) {
    await rollbar.error('handler error', error, { lambdaEvent })
    throw error
  }
}
