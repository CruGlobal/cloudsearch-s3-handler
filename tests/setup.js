require('dotenv').config({ path: '.env.test' })
const path = require('path')

global.__fixturesDir = path.join(__dirname, 'fixtures')
