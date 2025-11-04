const { ethers } = require('ethers')
const { requireAdmin } = require('../middleware/adminAuth')

describe('adminAuth middleware', () => {
  const originalEnv = process.env.ADMIN_ADDRESS
  let adminWallet

  beforeAll(() => {
    adminWallet = ethers.Wallet.createRandom()
    process.env.ADMIN_ADDRESS = adminWallet.address
  })

  afterAll(() => {
    process.env.ADMIN_ADDRESS = originalEnv
  })

  function createMock() {
    const req = { headers: {} }
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(payload) {
        this.body = payload
      }
    }
    const next = jest.fn()
    return { req, res, next }
  }

  it('allows requests with a valid admin signature', async () => {
    const message = 'zkVerify admin login'
    const signature = await adminWallet.signMessage(message)
    const { req, res, next } = createMock()

    req.headers.signature = signature
    req.headers.message = message

    requireAdmin(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.statusCode).toBe(200)
    expect(res.body).toBeNull()
  })

  it('blocks requests with an invalid signature', () => {
    const { req, res, next } = createMock()
    req.headers.signature = '0xdead'
    req.headers.message = 'something'

    requireAdmin(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'Authentication failed: Invalid signature' })
  })

  it('blocks requests without credentials', () => {
    const { req, res, next } = createMock()

    requireAdmin(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'Authentication required: Missing signature or message' })
  })
})
