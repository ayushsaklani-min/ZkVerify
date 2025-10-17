# zkVerify

Verifiable Smart Contract Audit Credential Platform on Moca Chain Testnet (EVM, chainId 5151).

## Overview

zkVerify lets auditors issue digital credentials, projects generate zero-knowledge proofs, and users verify audit status on-chain without revealing private audit reports.

Architecture:

- Auditor → Mock AIR Kit SDK → Smart Contract (Moca Testnet) → Project (ZK proof) → User (Verify)

## Tech Stack

- Solidity + Hardhat
- Next.js 14 (App Router) + Tailwind + Framer Motion + Lucide
- Wagmi + Ethers v6
- Optional backend: Express

## Repo Layout

```
zkVerify/
 ├─ contracts/ProofVerifier.sol
 ├─ scripts/deploy.js
 ├─ tests/ProofVerifier.test.js
 ├─ frontend/
 │   ├─ app/{auditor,project,verify}/page.jsx
 │   ├─ src/lib/airkit/index.js
 │   ├─ src/lib/{chain,ethers,hash}.js
 │   ├─ src/components/
 │   └─ src/abi/ProofVerifier.json
 ├─ backend/server.js
 ├─ hardhat.config.js
 ├─ .env.example
 └─ README.md
```

## Environment

Copy `.env.example` to `.env` and set values:

```
RPC_URL=https://testnet-rpc.mechain.tech
DEPLOYER_PRIVATE_KEY=your_testnet_private_key
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.mechain.tech
NEXT_PUBLIC_CHAIN_ID=5151
```

## Commands

Install dependencies:

```
npm run install:all
```

Compile & test:

```
npm run compile
npm test
```

Deploy contract to Moca Testnet:

```
npm run deploy
```

The script writes `frontend/src/config.js` with the deployed address.

Run frontend:

```
cd frontend && npm run dev
```

Run backend:

```
cd backend && npm run dev
```

## Moca Testnet (MetaMask)

```
{
  "chainId": "0x36888",
  "chainName": "Moca Chain Testnet",
  "nativeCurrency": { "name": "Moca", "symbol": "MOCA", "decimals": 18 },
  "rpcUrls": ["https://testnet-rpc.mechain.tech"],
  "blockExplorerUrls": ["https://testnet-scan.mocachain.org"]
}
```

## UI/UX Features

- **Glassmorphism Design**: Modern translucent cards with backdrop blur effects
- **Gradient Animations**: Smooth color transitions and hover effects
- **Framer Motion**: Page transitions, component animations, and micro-interactions
- **Responsive Layout**: Mobile-first design that adapts to all screen sizes
- **Toast Notifications**: Real-time feedback for all user actions
- **Confetti Celebrations**: Visual celebration on successful verification
- **Animated Badges**: Dynamic status indicators with pulse effects

## AIR Kit Integration Notes

The mock SDK is in `frontend/src/lib/airkit/index.js` and exposes:

- `issueCredential(payload)` - Issue audit credentials
- `generateProof(credential)` - Generate ZK proofs
- `verifyProof(proof)` - Verify proof validity

When the real AIR Kit SDK is available, replace this file keeping the same method signatures.
All frontend components are designed to work seamlessly with the real SDK without modification.

## CI/CD

GitHub Actions workflow in `.github/workflows/ci.yml` runs lint, build, and tests. Extend to deploy to Vercel and your hosting for the backend.

## License

MIT


