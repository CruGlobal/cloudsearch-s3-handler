const rollbar = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
}
export { rollbar as default }
