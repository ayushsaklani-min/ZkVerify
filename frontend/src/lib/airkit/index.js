/**
 * AIR Kit SDK Integration
 * 
 * Client-side helpers that proxy AIR Kit operations through the backend REST API.
 */

import axios from 'axios';

// Direct AIR API client (used only when backend proxy is unavailable)
const air3Client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'https://api.sandbox.air3.com',
  headers: {
    'x-partner-id': process.env.NEXT_PUBLIC_PARTNER_ID,
    'Content-Type': 'application/json'
  }
});

/**
 * Issue a new credential via AIR Kit SDK
 * @param {Object} params - Credential parameters
 * @param {string} params.issuer - Issuer address (mapped to issuer_did)
 * @param {string} params.subject - Subject (project) address (mapped to subject_did)
 * @param {string} params.summaryHash - Hash of the audit summary
 * @param {string} params.status - Verification status
 * @returns {Promise<Object>} Credential object from AIR Kit
 */
export async function issueCredential({ issuer, subject, summaryHash, status, issuerSignature }) {
  try {
    console.log('🎫 AIR Kit: Issuing credential via backend...', { subject, status });

    // Use backend endpoint (server securely handles AIR Kit auth)
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';
    if (!issuerSignature) {
      throw new Error('issuerSignature is required when issuing credentials');
    }
    const response = await fetch(`${BACKEND_URL}/api/issueCredential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issuer, subject, summaryHash, status, issuerSignature })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error || `Issue failed (${response.status})`);
    }
    
    const data = await response.json();
    
    const credential = {
      ...data,
      // Keep compatibility with frontend
      id: data.credential_id || data.id,
      onChainId: data.on_chain_id || null,
      issuer,
      subject,
      summaryHash,
      status,
      issuedAt: data.issued_at || new Date().toISOString(),
      serverSignature: data.server_signature || null,
      schema: 'air3-audit-v1',
      type: 'SmartContractAudit',
      version: '1.0.0'
    };

    console.log('✅ AIR Kit: Credential issued', credential);
    return credential;
  } catch (error) {
    console.error('❌ AIR Kit: Credential issuance failed', error.message);
    throw new Error(`Failed to issue credential: ${error.message}`);
  }
}

/**
 * Generate a zero-knowledge proof for a credential via AIR Kit SDK
 * @param {Object} credential - The credential to prove
 * @returns {Promise<Object>} Proof object from AIR Kit
 */
export async function generateProof(credential) {
  try {
    console.log('🔐 AIR Kit: Generating proof via backend...', credential);
    
    // Use backend endpoint which proxies AIR Kit
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';
    const response = await fetch(`${BACKEND_URL}/api/proofs/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId: credential.credential_id || credential.id })
    });
    
    if (!response.ok) {
      throw new Error(`Proof generation failed (${response.status})`);
    }
    
    const data = await response.json();
    
    const proof = {
      ...data,
      proofId: data.proof_id,
      credentialId: credential.credential_id || credential.id,
       credentialOnChainId: data.on_chain_id || null,
       on_chain_id: data.on_chain_id || null,
      credential,
      valid: data.valid !== false,
      generatedAt: Date.now(),
      proofData: data.proof_data || {},
      stats: data.stats || null
    };

    console.log('✅ AIR Kit: Proof generated', proof);
    return proof;
  } catch (error) {
    console.error('❌ AIR Kit: Proof generation failed', error.message);
    throw new Error(`Failed to generate proof: ${error.message}`);
  }
}

/**
 * Verify a zero-knowledge proof via AIR Kit SDK
 * @param {Object} proof - The proof to verify
 * @returns {Promise<boolean>} Verification result
 */
export async function verifyProof(proof) {
  try {
    console.log('🔍 AIR Kit: Verifying proof via backend...', proof);
    
    // Use backend endpoint which proxies AIR Kit
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';
    const response = await fetch(`${BACKEND_URL}/api/verifyProof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof })
    });
    
    if (!response.ok) {
      throw new Error(`Proof verification failed (${response.status})`);
    }
    
    const data = await response.json();
    const isValid = data.ok === true;
    
    console.log(`${isValid ? '✅' : '❌'} AIR Kit: Proof verification ${isValid ? 'PASSED' : 'FAILED'}`);
    
    return { ok: isValid, txHash: data.txHash, gasUsed: data.gasUsed };
  } catch (error) {
    console.error('❌ AIR Kit: Proof verification failed', error.message);
    return { ok: false, error: error.message };
  }
}

/**
 * Get credential by ID (AIR Kit implementation)
 * @param {string} credentialId - The credential ID
 * @returns {Promise<Object|null>} Credential object or null
 */
export async function getCredential(credentialId) {
  try {
    console.log('📡 AIR Kit: Fetching credential...', credentialId);
    
    // Use backend endpoint if available, otherwise fallback to direct AIR REST
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';
    try {
      const response = await fetch(`${BACKEND_URL}/api/credentials/${credentialId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Backend endpoint not available, using legacy method');
    }
    
    // Fallback to legacy client (if API endpoint is available)
    const response = await air3Client.get(`/issuer/credentials/${credentialId}`);
    return response.data;
  } catch (error) {
    console.error('❌ AIR Kit: Get credential failed', error.message);
    return null;
  }
}

/**
 * List credentials for an issuer (AIR Kit implementation)
 * @param {string} issuerAddress - The issuer address
 * @returns {Promise<Array>} Array of credentials
 */
export async function listCredentials(issuerAddress) {
  try {
    console.log('📡 AIR Kit: Listing credentials for issuer...', issuerAddress);
    
    // Use backend endpoint if available
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';
    try {
      const response = await fetch(`${BACKEND_URL}/api/credentials?issuer=${issuerAddress}`);
      if (response.ok) {
        const data = await response.json();
        return data.credentials || [];
      }
    } catch (e) {
      console.warn('Backend endpoint not available, using legacy method');
    }
    
    // Fallback to legacy client
    const response = await air3Client.get('/issuer/credentials', {
      params: {
        issuer_did: process.env.NEXT_PUBLIC_ISSUER_DID
      }
    });
    return response.data.credentials || [];
  } catch (error) {
    console.error('❌ AIR Kit: List credentials failed', error.message);
    return [];
  }
}

/**
 * Health check for AIR Kit service
 * @returns {Promise<Object>} Service status
 */
export async function healthCheck() {
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:10000';
    const res = await fetch(`${BACKEND_URL}/health`);
    if (res.ok) {
      const data = await res.json();
      return { status: 'healthy', timestamp: new Date().toISOString(), ...data };
    }
    return { status: 'degraded', timestamp: new Date().toISOString() };
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
