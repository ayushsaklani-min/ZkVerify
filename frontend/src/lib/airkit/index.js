/**
 * AIR3 SDK Integration
 * 
 * Real AIR3 API implementation for credential issuance, proof generation, and verification.
 * This replaces the mock implementation with actual AIR3 API calls.
 */

import axios from 'axios';

// Create AIR3 API client
const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'https://api.sandbox.air3.com',
  headers: {
    'x-partner-id': process.env.NEXT_PUBLIC_PARTNER_ID,
    'Content-Type': 'application/json'
  }
});

/**
 * Issue a new credential via AIR3
 * @param {Object} params - Credential parameters
 * @param {string} params.issuer - Issuer address (mapped to issuer_did)
 * @param {string} params.subject - Subject (project) address (mapped to subject_did)
 * @param {string} params.summaryHash - Hash of the audit summary
 * @param {string} params.status - Verification status
 * @returns {Promise<Object>} Credential object from AIR3
 */
export async function issueCredential({ issuer, subject, summaryHash, status }) {
  try {
    const payload = {
      partner_id: process.env.NEXT_PUBLIC_PARTNER_ID,
      issuer_did: process.env.NEXT_PUBLIC_ISSUER_DID,
      subject_did: subject, // Using wallet address as subject_did
      verifier_did: process.env.NEXT_PUBLIC_VERIFIER_DID,
      credential_type: 'SmartContractAudit',
      logo_url: process.env.NEXT_PUBLIC_LOGO_URL,
      website_url: process.env.NEXT_PUBLIC_WEBSITE_URL,
      summary_hash: summaryHash,
      status,
      metadata: {
        name: process.env.NEXT_PUBLIC_PARTNER_NAME || 'zkVerify',
        issuer_address: issuer
      },
      jwks_url: process.env.NEXT_PUBLIC_JWKS_URL
    };

    console.log('🎫 AIR3: Issuing credential...', { subject, status });
    const response = await client.post('/issuer/credentials', payload);
    
    const credential = {
      ...response.data,
      // Keep compatibility with frontend
      id: response.data.credential_id,
      issuer,
      subject,
      summaryHash,
      status,
      issuedAt: response.data.issued_at || new Date().toISOString(),
      schema: 'air3-audit-v1',
      type: 'SmartContractAudit',
      version: '1.0.0'
    };

    console.log('✅ AIR3: Credential issued', credential);
    return credential;
  } catch (error) {
    console.error('❌ AIR3: Credential issuance failed', error.response?.data || error.message);
    throw new Error(`Failed to issue credential: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Generate a zero-knowledge proof for a credential via AIR3
 * @param {Object} credential - The credential to prove
 * @returns {Promise<Object>} Proof object from AIR3
 */
export async function generateProof(credential) {
  try {
    const payload = {
      credential_id: credential.credential_id || credential.id,
      verifier_did: process.env.NEXT_PUBLIC_VERIFIER_DID
    };

    console.log('🔐 AIR3: Generating proof...', payload);
    const response = await client.post('/proofs/generate', payload);
    
    const proof = {
      ...response.data,
      // Keep compatibility with frontend
      proofId: response.data.proof_id,
      credentialId: credential.credential_id || credential.id,
      credential,
      valid: response.data.valid !== false,
      generatedAt: Date.now(),
      proofData: response.data.proof_data || {}
    };

    console.log('✅ AIR3: Proof generated', proof);
    return proof;
  } catch (error) {
    console.error('❌ AIR3: Proof generation failed', error.response?.data || error.message);
    throw new Error(`Failed to generate proof: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Verify a zero-knowledge proof via AIR3
 * @param {Object} proof - The proof to verify
 * @returns {Promise<boolean>} Verification result
 */
export async function verifyProof(proof) {
  try {
    const payload = {
      proof_id: proof.proof_id || proof.proofId,
      verifier_did: process.env.NEXT_PUBLIC_VERIFIER_DID
    };

    console.log('🔍 AIR3: Verifying proof...', payload);
    const response = await client.post('/proofs/verify', payload);
    
    const isValid = response.data.valid === true;
    console.log(`${isValid ? '✅' : '❌'} AIR3: Proof verification ${isValid ? 'PASSED' : 'FAILED'}`);
    
    return isValid;
  } catch (error) {
    console.error('❌ AIR3: Proof verification failed', error.response?.data || error.message);
    return false;
  }
}

/**
 * Get credential by ID (AIR3 implementation)
 * @param {string} credentialId - The credential ID
 * @returns {Promise<Object|null>} Credential object or null
 */
export async function getCredential(credentialId) {
  try {
    console.log('📡 AIR3: Fetching credential...', credentialId);
    const response = await client.get(`/issuer/credentials/${credentialId}`);
    return response.data;
  } catch (error) {
    console.error('❌ AIR3: Get credential failed', error.response?.data || error.message);
    return null;
  }
}

/**
 * List credentials for an issuer (AIR3 implementation)
 * @param {string} issuerAddress - The issuer address
 * @returns {Promise<Array>} Array of credentials
 */
export async function listCredentials(issuerAddress) {
  try {
    console.log('📡 AIR3: Listing credentials for issuer...', issuerAddress);
    const response = await client.get('/issuer/credentials', {
      params: {
        issuer_did: process.env.NEXT_PUBLIC_ISSUER_DID
      }
    });
    return response.data.credentials || [];
  } catch (error) {
    console.error('❌ AIR3: List credentials failed', error.response?.data || error.message);
    return [];
  }
}

/**
 * Health check for AIR3 service
 * @returns {Promise<Object>} Service status
 */
export async function healthCheck() {
  try {
    const response = await client.get('/health');
    return {
      status: 'healthy',
      version: response.data.version || '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        credential: 'operational',
        proof: 'operational',
        verification: 'operational'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Export all functions as default object for easier importing
export default {
  issueCredential,
  generateProof,
  verifyProof,
  getCredential,
  listCredentials,
  healthCheck
};