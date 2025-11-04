# zkVerify Architecture

## Overview

zkVerify is a privacy-preserving audit verification layer built on Moca Chain that enables auditors to issue verifiable credentials and projects to prove audit completion without revealing sensitive report details.

## System Components

### Smart Contracts

**AuditorRegistry.sol**
- Maintains registry of approved auditors
- Stores auditor profiles (GitHub, Code4rena, Immunefi handles)
- Tracks credibility scores and credential counts
- Enforces admin-gated auditor approval

**ZKVerifier.sol**
- Performs on-chain verification of prover-signed proofs
- Validates EIP-191 signatures from trusted prover
- Emits `ProofVerified` events with gas metrics
- Prevents proof replay attacks via `proofId` tracking

**ProofVerifier.sol**
- Anchors audit credentials on-chain
- Records verification status for projects
- Integrates with `ZKVerifier` for proof validation
- Links credentials to auditor and project addresses
- Validates public inputs against credential data

### Backend Services

**Express.js API Server**
- RESTful API endpoints for credential issuance and verification
- EIP-191 signature-based admin authentication
- JWT session management for admin routes
- Metrics collection and aggregation
- Reputation service integration

**Services**
- `credentialStore`: In-memory credential storage and retrieval
- `metricsService`: Proof generation and verification metrics
- `reputationService`: Fetches auditor reputation from external APIs
- `credibilityCredential`: Issues credibility credentials via AIR Kit
- `contractDetector`: Automatically extracts contract addresses from work history

### Frontend

**Next.js 14 Application**
- Server-side rendering with App Router
- Web3 wallet integration via Wagmi
- Real-time metrics dashboard
- Admin dashboard for auditor approval
- Auditor credential issuance interface
- Project verification flow

## Smart Contract Call Flow

### Auditor Approval Flow

1. Admin calls `AuditorRegistry.approveAuditor(auditorAddress)`
2. Backend fetches reputation data from GitHub/Code4rena/Immunefi
3. Backend issues credibility credential via AIR Kit
4. Admin calls `AuditorRegistry.updateCredibilityScore(address, score)`
5. Auditor is marked as approved and can issue credentials

### Credential Issuance Flow

1. Auditor signs `summaryHash` with their wallet (EIP-191)
2. Backend calls AIR Kit API to issue credential
3. Backend stores credential metadata
4. Auditor calls `ProofVerifier.anchorCredential(credentialId, summaryHash, issuer)`
5. Credential is anchored on-chain with `onChainId`

### Proof Generation Flow

1. Project requests proof generation via `/api/proofs/generate`
2. Backend validates credential exists
3. Backend generates mock proof bytes
4. Backend constructs `publicInputs = [project, auditor, summaryHash]`
5. Backend signs proof digest with `PROOF_SIGNER_PRIVATE_KEY`
6. Returns proof data with signature

### Verification Flow

1. Project submits proof to `/api/verifyProof`
2. Backend validates proof signature
3. Backend calls `ProofVerifier.recordVerification(...)`
4. Contract validates:
   - Credential is anchored
   - Issuer matches approved auditor
   - Public inputs match credential data
   - Proof signature is valid (via `ZKVerifier`)
   - Proof ID hasn't been used
5. Contract marks project as verified
6. Emits `ProofValidated` and `AuditVerified` events

## Deployment Topology

### Frontend (Vercel)

- **Framework**: Next.js 14
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Environment Variables**: 
  - `NEXT_PUBLIC_CONTRACT_ADDRESS`
  - `NEXT_PUBLIC_RPC_URL`
  - `NEXT_PUBLIC_CHAIN_ID`
  - `NEXT_PUBLIC_BACKEND_URL`

### Backend (Render)

- **Runtime**: Node.js
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: 10000
- **Environment Variables**:
  - `RPC_URL`
  - `DEPLOYER_PRIVATE_KEY`
  - `ADMIN_PRIVATE_KEY`
  - `PROOF_SIGNER_PRIVATE_KEY`
  - Contract addresses

### Smart Contracts (Moca Testnet)

- **Network**: Moca Chain Testnet (Chain ID: 222888)
- **RPC**: `https://testnet-rpc.mocachain.org`
- **Explorer**: `https://testnet-scan.mocachain.org`
- **Deployment**: Via Hardhat scripts

## Security Considerations

- Admin authentication via EIP-191 signatures
- JWT tokens with 30-minute expiration
- Rate limiting on API endpoints
- Input validation on all routes
- Proof replay prevention via `proofId` tracking
- Credential issuer signature verification
- On-chain proof signature validation

## Data Flow

```
Auditor → Backend API → AIR Kit → Credential Store
                ↓
         Anchor on-chain
                ↓
         Project requests proof
                ↓
         Backend generates proof
                ↓
         Project submits proof
                ↓
         Contract verifies
                ↓
         Project marked verified
```


