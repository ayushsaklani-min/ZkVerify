# zkVerify

**Privacy-Preserving Audit Verification Layer for Moca**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

zkVerify enables auditors to issue verifiable smart-contract audit credentials that projects can prove without revealing sensitive report details. Built on Moca Chain with on-chain zero-knowledge proof verification, auditor reputation scoring, and real-time metrics transparency.

## Overview

zkVerify is a production-ready protocol that combines cryptographic verification with practical trust signals. Auditors are vetted through on-chain approval, reputation data from GitHub/Code4rena/Immunefi, and credibility scoring. Projects can prove audit completion via zero-knowledge proofs while maintaining privacy of audit reports.

## Repository Structure

```
zkVerify/
├── contracts/              # Smart contracts (Solidity)
│   ├── AuditorRegistry.sol
│   ├── ProofVerifier.sol
│   └── ZKVerifier.sol
├── scripts/               # Deployment scripts
│   ├── deploy.js
│   └── deployUpgraded.js
├── tests/                 # Hardhat test suite
│   ├── AuditorRegistry.test.js
│   ├── ProofVerifier.test.js
│   └── ZKVerifier.test.js
├── backend/               # Express.js API server
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── middleware/         # Authentication & validation
│   ├── tests/             # Backend test suite
│   ├── server.js          # Main application entry
│   └── render.yaml        # Render deployment config
├── frontend/              # Next.js 14 application
│   ├── app/               # App Router pages
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities & helpers
│   │   ├── abi/           # Contract ABIs
│   │   └── config.js      # Configuration
│   └── vercel.json        # Vercel deployment config
├── security/              # Security audit artifacts
│   ├── slither.config.json
│   ├── slither-report.json
│   └── summary.md
├── docs/                  # Documentation
│   ├── architecture.md
│   └── final_wave_report.md
├── demo/                  # Demo materials
│   └── runbook.md
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD pipeline
├── hardhat.config.js      # Hardhat configuration
├── package.json           # Root package.json
├── LICENSE                # MIT License
├── CONTRIBUTING.md        # Contribution guidelines
└── README.md              # This file
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Smart Contracts | Solidity 0.8.20, Hardhat |
| Frontend | Next.js 14, React, Tailwind CSS, Wagmi, Ethers.js v6 |
| Backend | Node.js, Express.js, JWT, EIP-191 |
| Deployment | Vercel (frontend), Render (backend) |
| Testing | Hardhat, Jest |
| Security | Slither static analysis |

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Moca Chain Testnet RPC access

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Blockchain Configuration
RPC_URL=https://testnet-rpc.mocachain.org
DEPLOYER_PRIVATE_KEY=your_private_key
ADMIN_PRIVATE_KEY=your_admin_key
PROOF_SIGNER_PRIVATE_KEY=your_proof_signer_key

# Contract Addresses (after deployment)
AUDITOR_REGISTRY_ADDRESS=0x...
PROOF_VERIFIER_ADDRESS=0x...
ZK_VERIFIER_ADDRESS=0x...

# Frontend Configuration
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.mocachain.org
NEXT_PUBLIC_CHAIN_ID=222888
NEXT_PUBLIC_BACKEND_URL=http://localhost:10000
```

### Development

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy contracts (Moca Testnet)
npm run deploy:upgraded

# Start backend (port 10000)
npm run backend:dev

# Start frontend (port 3000)
npm run frontend:dev
```

## Judge Quickstart

For rapid local evaluation:

```bash
# 1. Start local Hardhat node
npx hardhat node &

# 2. Deploy contracts to localhost
npx hardhat run scripts/deployUpgraded.js --network localhost

# 3. Start backend and frontend
(cd backend && npm run dev) & (cd frontend && npm run dev)
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:10000
- Metrics: http://localhost:10000/metrics

**Expected Performance:**
- Proof generation: < 3 seconds
- On-chain verification: < 300k gas

## Live Deployment

- **Frontend**: [Vercel Deployment](https://zk-verify.vercel.app)
- **Backend API**: [Render Deployment](https://zkverify-backend.onrender.com)
- **Network**: Moca Chain Testnet (Chain ID: 222888)
- **Block Explorer**: [testnet-scan.mocachain.org](https://testnet-scan.mocachain.org)

## Key Features

- **On-Chain ZK Verification**: Cryptographic proof validation before project verification
- **Auditor Trust Layer**: Gated onboarding with reputation scoring from GitHub, Code4rena, Immunefi
- **Privacy-Preserving**: Projects prove audit completion without revealing report details
- **Real-Time Metrics**: Dashboard with proof generation time, gas usage, success rates
- **Signature-Bound Credentials**: EIP-191 signatures prevent credential spoofing
- **Admin Authentication**: Secure EIP-191 + JWT authentication for admin routes

## Documentation

- [Architecture Overview](./docs/architecture.md) - System design and component flow
- [Contributing Guidelines](./CONTRIBUTING.md) - Development standards and PR process
- [Demo Runbook](./demo/runbook.md) - Step-by-step demo walkthrough

## Security

Security audit artifacts are available in `/security`. Static analysis via Slither is integrated into CI/CD pipeline.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Maintainers

- **zkVerify Team** - [GitHub](https://github.com/zkverify)

## Contact

For security issues, please email: security@zkverify.io

---

**Built for Moca Buildathon 2025**
