# Patient-Centric Health Records MVP + CCG

Local demo dApp for encrypted patient-owned health records with a Solidity consent ledger, simulated IPFS, and a Contextual Consent Grammar policy layer.

## Quick Start

```bash
npm install
npm run compile
npm run test
```

In separate terminals:

```bash
npm run dev:chain
npm run deploy:local
npm run dev:frontend
```

Open the Vite URL, connect MetaMask to `http://127.0.0.1:8545` with chain ID `31337`, and use the contract address written by `npm run deploy:local`.

## Demo Security Caveat

This Phase 1 demo intentionally stores raw AES key material on-chain when the patient grants access. That keeps the local consent flow easy to inspect, but it is not production-grade key exchange. A production version should register doctor public encryption keys or use a wallet-based key exchange flow before writing encrypted key material to the ledger.
