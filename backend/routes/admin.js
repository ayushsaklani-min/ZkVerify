/**
 * zkVerify — Moca Buildathon 2025 | Auditable Zero-Knowledge Verification Layer
 * 
 * Admin API routes for auditor approval, rejection, and application management.
 * Requires admin authentication via middleware.
 */

const express = require('express');
const { ethers } = require('ethers');
const reputationService = require('../services/reputationService');
const credibilityCredential = require('../services/credibilityCredential');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Path to pending applications file
const APPLICATIONS_FILE = path.join(__dirname, '..', 'pending-applications.json');

/**
 * Read pending applications
 */
function getPendingApplications() {
  if (!fs.existsSync(APPLICATIONS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(APPLICATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading applications file:', error);
    return [];
  }
}

/**
 * Save pending applications
 */
function saveApplications(applications) {
  fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(applications, null, 2));
}

/**
 * Mark application as reviewed
 */
function markApplicationReviewed(walletAddress, status, reviewedBy = 'admin') {
  const applications = getPendingApplications();
  const index = applications.findIndex(
    app => app.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
  
  if (index !== -1) {
    applications[index].status = status;
    applications[index].reviewedAt = new Date().toISOString();
    applications[index].reviewedBy = reviewedBy;
    saveApplications(applications);
    return true;
  }
  return false;
}

// Contract ABIs and addresses
const AUDITOR_REGISTRY_ABI = require('../../frontend/src/abi/AuditorRegistry.json');
const AUDITOR_REGISTRY_ADDRESS = process.env.AUDITOR_REGISTRY_ADDRESS || process.env.NEXT_PUBLIC_AUDITOR_REGISTRY_ADDRESS;

// Provider setup
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || 'https://testnet-rpc.mechain.tech'
);

// Normalize private key (same logic as server.js)
function normalizePrivateKey(raw) {
  if (!raw) throw new Error('Missing ADMIN_PRIVATE_KEY')
  // Remove all whitespace including newlines and carriage returns
  const cleaned = String(raw).replace(/\s/g, '').trim()
  const withPrefix = cleaned.startsWith('0x') ? cleaned : `0x${cleaned}`
  // Private key should be 64 hex chars + '0x' = 66 total
  if (withPrefix.length !== 66) {
    throw new Error(`Invalid ADMIN_PRIVATE_KEY length: ${withPrefix.length} (expected 66 with 0x prefix, got: "${withPrefix}")`)
  }
  return withPrefix
}

// Get admin wallet for on-chain operations
function getAdminWallet() {
  const adminKey = process.env.ADMIN_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!adminKey) {
    throw new Error('ADMIN_PRIVATE_KEY not configured');
  }
  try {
    const normalizedKey = normalizePrivateKey(adminKey);
    return new ethers.Wallet(normalizedKey, provider);
  } catch (error) {
    console.error('Error creating admin wallet:', error.message);
    console.error('Private key (first 10 chars):', adminKey.substring(0, 10));
    throw new Error(`Failed to create admin wallet: ${error.message}`);
  }
}

function getAuditorRegistryContract() {
  const wallet = getAdminWallet();
  return new ethers.Contract(AUDITOR_REGISTRY_ADDRESS, AUDITOR_REGISTRY_ABI, wallet);
}

/**
 * POST /api/admin/approve-auditor
 * Approve an auditor and issue credibility credential
 */
router.post('/approve-auditor', async (req, res) => {
  try {
    const { auditorAddress, githubHandle, code4renaHandle, immunefiHandle } = req.body;

    if (!ethers.isAddress(auditorAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid auditor address format'
      });
    }

    const contract = getAuditorRegistryContract();

    // Check if already approved
    const currentInfo = await contract.getAuditorInfo(auditorAddress);
    if (currentInfo.isApproved) {
      return res.status(400).json({
        success: false,
        error: 'Auditor already approved'
      });
    }

    // Approve auditor on-chain (do not block UI while waiting for confirmations)
    console.log(`📝 Approving auditor ${auditorAddress}...`);
    const approveTx = await contract.approveAuditor(auditorAddress);
    console.log(`✅ approveAuditor tx sent: ${approveTx.hash}`);
    // Mark as approved locally and respond immediately (prevent UI spinner)
    markApplicationReviewed(auditorAddress.toLowerCase(), 'approved', 'admin');
    res.json({
      success: true,
      auditor: {
        address: auditorAddress,
        isApproved: true,
        credibilityScore: null,
        credentialCount: 0
      },
      txHash: approveTx.hash,
      message: 'Approval submitted. Finalization will continue in the background.'
    });

    // Fire-and-forget background finalization
    ;(async () => {
      // Wait up to ~60s for 1 confirmation
      let approvalConfirmed = false;
      try {
        await provider.waitForTransaction(approveTx.hash, 1, 60_000);
        console.log('✅ approveAuditor confirmed');
        approvalConfirmed = true;
      } catch (_) {
        console.warn('⏱ approveAuditor confirmation timed out; continuing');
      }

      if (githubHandle || code4renaHandle || immunefiHandle) {
        console.log(`ℹ️  Profile handles provided. Auditor should call updateAuditorProfile() themselves.`);
      }

      const auditorInfo = {
        address: auditorAddress,
        githubHandle: githubHandle || '',
        code4renaHandle: code4renaHandle || '',
        immunefiHandle: immunefiHandle || '',
        credentialCount: 0,
        approvedAt: Date.now()
      };
      const reputation = await reputationService.getAuditorReputation(auditorInfo);

      console.log(`🎫 Issuing credibility credential for ${auditorAddress}...`);
      await credibilityCredential.issueCredibilityCredential(
        auditorAddress,
        auditorInfo,
        reputation
      );

      if (reputation.credibilityScore > 0) {
        const tryUpdateScore = async () => {
          try {
            const scoreTx = await contract.updateCredibilityScore(auditorAddress, reputation.credibilityScore);
            console.log(`✅ updateCredibilityScore tx sent: ${scoreTx.hash}`);
            try {
              await provider.waitForTransaction(scoreTx.hash, 1, 60_000);
              console.log('✅ updateCredibilityScore confirmed');
            } catch (_) {
              console.warn('⏱ updateCredibilityScore confirmation timed out; continuing');
            }
          } catch (err) {
            console.warn('⚠️ updateCredibilityScore failed (background):', err?.shortMessage || err?.message);
          }
        };
        if (approvalConfirmed) {
          await tryUpdateScore();
        } else {
          setTimeout(tryUpdateScore, 30_000);
        }
      }
    })().catch((e) => console.warn('Background approval tasks failed:', e?.message));
  } catch (error) {
    console.error('Error approving auditor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve auditor',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/applications
 * Get all applications (pending, approved, rejected)
 */
router.get('/applications', async (req, res) => {
  try {
    const applications = getPendingApplications();
    const { status } = req.query;
    
    let filtered = applications;
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filtered = applications.filter(app => app.status === status);
    }
    
    res.json({
      success: true,
      count: filtered.length,
      applications: filtered
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/reject-application
 * Reject an application
 */
router.post('/reject-application', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    const success = markApplicationReviewed(walletAddress.toLowerCase(), 'rejected', 'admin');

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application rejected'
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject application',
      message: error.message
    });
  }
});

module.exports = router;

