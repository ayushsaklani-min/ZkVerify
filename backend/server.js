const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const { ethers } = require('ethers')
const axios = require('axios')
const abi = require('../frontend/src/abi/ProofVerifier.json')
const { randomUUID } = require('crypto')

// Load env from repo root (../.env) even when running from backend/
dotenv.config({ path: path.join(__dirname, '..', '.env') })
// Also load local backend/.env if present (won't override existing)
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Network / contract
const RPC_URL = process.env.RPC_URL || 'https://testnet-rpc.mocachain.org'
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS

// AIR3 client (server-side)
const air3 = axios.create({
  baseURL: process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE || 'https://api.sandbox.air3.com',
  headers: {
    'x-partner-id': process.env.PARTNER_ID || process.env.NEXT_PUBLIC_PARTNER_ID,
    'Content-Type': 'application/json'
  }
})

function isNetworkError(err) {
  const code = err?.code || err?.errno || err?.response?.status
  const msg = (err?.message || '').toLowerCase()
  return (
    code === 'ENOTFOUND' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNABORTED' ||
    msg.includes('enotfound') ||
    msg.includes('network error') ||
    msg.includes('getaddrinfo')
  )
}

let signer, contract

function normalizePrivateKey(raw) {
  if (!raw) throw new Error('Missing DEPLOYER_PRIVATE_KEY')
  const trimmed = String(raw).trim()
  const withPrefix = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`
  if (withPrefix.length !== 66) {
    throw new Error('Invalid DEPLOYER_PRIVATE_KEY length (expected 32 bytes / 64 hex chars)')
  }
  return withPrefix
}

function getContract() {
  if (!CONTRACT_ADDRESS) throw new Error('Missing CONTRACT_ADDRESS')
  if (!signer) {
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const normalizedKey = normalizePrivateKey(PRIVATE_KEY)
    signer = new ethers.Wallet(normalizedKey, provider)
  }
  if (!contract) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer)
  }
  return contract
}

app.get('/health', (_req, res) => {
  return res.json({ status: 'ok', network: 'moca-testnet', rpc: RPC_URL, contract: CONTRACT_ADDRESS })
})

// Basic root and API index for diagnostics
app.get('/', (_req, res) => {
  res.send('zkVerify backend running. See /health and POST /api/* routes.')
})

app.get('/api', (_req, res) => {
  res.json({
    ok: true,
    routes: [
      'GET /health',
      'GET /api/wallet',
      'POST /api/issueCredential',
      'POST /api/issuecredential (alias)',
      'POST /api/proofs/generate',
      'POST /api/verifyProof',
    ],
  })
})

// Expose backend wallet address so you can fund it with MOCA
app.get('/api/wallet', (_req, res) => {
  try {
    const normalizedKey = normalizePrivateKey(PRIVATE_KEY)
    const wallet = new ethers.Wallet(normalizedKey)
    return res.json({ address: wallet.address })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
})

// Generate proof via AIR3 (with offline fallback)
app.post('/api/proofs/generate', async (req, res) => {
  try {
    const { credentialId } = req.body
    if (!credentialId) return res.status(400).json({ error: 'Missing credentialId' })
    const verifierDid = process.env.VERIFIER_DID || process.env.NEXT_PUBLIC_VERIFIER_DID

    try {
      if (verifierDid) {
        const r = await air3.post('/proofs/generate', {
          credential_id: credentialId,
          verifier_did: verifierDid,
        })
        return res.json(r.data)
      }
      // No verifier DID configured → fall back immediately
      return res.json({ proof_id: randomUUID(), valid: true, credential_id: credentialId, proof_data: {} })
    } catch (e) {
      if (!verifierDid || isNetworkError(e) || process.env.AIR3_FALLBACK_ON_ERROR === 'true') {
        return res.json({
          proof_id: randomUUID(),
          valid: true,
          credential_id: credentialId,
          proof_data: {},
        })
      }
      throw e
    }
  } catch (e) {
    console.error('generateProof error', e?.response?.data || e.message)
    return res.status(500).json({ error: e?.response?.data?.message || e.message })
  }
})

// Issue credential via AIR3 (server-side to avoid CORS)
async function issueCredentialHandler(req, res) {
  try {
    const { issuer, subject, summaryHash, status } = req.body
    if (!issuer || !subject || !summaryHash || !status) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const payload = {
      partner_id: process.env.PARTNER_ID || process.env.NEXT_PUBLIC_PARTNER_ID,
      issuer_did: process.env.ISSUER_DID || process.env.NEXT_PUBLIC_ISSUER_DID,
      subject_did: subject,
      verifier_did: process.env.VERIFIER_DID || process.env.NEXT_PUBLIC_VERIFIER_DID,
      credential_type: 'SmartContractAudit',
      logo_url: process.env.LOGO_URL || process.env.NEXT_PUBLIC_LOGO_URL,
      website_url: process.env.WEBSITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL,
      summary_hash: summaryHash,
      status,
      metadata: { name: process.env.PARTNER_NAME || process.env.NEXT_PUBLIC_PARTNER_NAME, issuer_address: issuer },
      jwks_url: process.env.JWKS_URL || process.env.NEXT_PUBLIC_JWKS_URL
    }

    try {
      const r = await air3.post('/issuer/credentials', payload)
      return res.json(r.data)
    } catch (e) {
      if (isNetworkError(e) || process.env.AIR3_FALLBACK_ON_ERROR === 'true') {
        // Fallback to mock credential so the flow can proceed offline
        const mock = {
          credential_id: randomUUID(),
          issued_at: new Date().toISOString(),
          issuer_did: payload.issuer_did,
          subject_did: payload.subject_did,
          status: payload.status,
          summary_hash: payload.summary_hash,
        }
        return res.json(mock)
      }
      throw e
    }
  } catch (e) {
    console.error('issueCredential error', e?.response?.data || e.message)
    return res.status(500).json({ error: e?.response?.data?.message || e.message })
  }
}

// Primary route (case-sensitive)
app.post('/api/issueCredential', issueCredentialHandler)
// Alias route (all lowercase) to avoid case-sensitivity issues
app.post('/api/issuecredential', issueCredentialHandler)
// Helpful GET for diagnostics (method guidance)
app.get('/api/issueCredential', (_req, res) => res.status(405).json({ error: 'Use POST /api/issueCredential' }))

// Verify proof via AIR3 then record on-chain
app.post('/api/verifyProof', async (req, res) => {
  try {
    const { proof, project, auditor, status } = req.body
    if (!proof || !project || !auditor || !status) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const verifierDid = process.env.VERIFIER_DID || process.env.NEXT_PUBLIC_VERIFIER_DID
    const proofId = proof.proof_id || proof.proofId
    if (!proofId) return res.status(400).json({ error: 'Missing proof_id' })

    // AIR3 verify (with fallback if offline)
    let valid = false
    try {
      if (verifierDid) {
        const verifyRes = await air3.post('/proofs/verify', {
          proof_id: proofId,
          verifier_did: verifierDid
        })
        valid = verifyRes?.data?.valid === true
      } else {
        valid = proof?.valid === true
      }
    } catch (e) {
      if (!verifierDid || isNetworkError(e) || process.env.AIR3_FALLBACK_ON_ERROR === 'true') {
        valid = proof?.valid === true
      } else {
        throw e
      }
    }
    if (!valid) return res.status(400).json({ error: 'Invalid proof' })

    // Record on-chain
    const c = getContract()
    const tx = await c.recordVerification(project, auditor, status)
    const receipt = await tx.wait()
    return res.json({ ok: true, txHash: receipt.hash })
  } catch (e) {
    const msg = (e?.response?.data?.message || e.message || '').toLowerCase()
    console.error('verifyProof error', e?.response?.data || e.message)
    if (msg.includes('insufficient funds')) {
      return res.status(400).json({ error: 'Backend wallet has insufficient MOCA for gas' })
    }
    if (msg.includes('invalid') && msg.includes('private key')) {
      return res.status(500).json({ error: 'Invalid DEPLOYER_PRIVATE_KEY format. Ensure it is a 0x-prefixed 64-hex string.' })
    }
    return res.status(500).json({ error: e?.response?.data?.message || e.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`))


