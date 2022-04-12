require('dotenv').config({ path: '.env' })
const path = require('path')

global.__fixturesDir = path.join(__dirname, 'fixtures')
