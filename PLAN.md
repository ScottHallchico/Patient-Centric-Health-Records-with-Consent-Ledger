# Patient-Centric Health Records MVP + CCG

## Summary
Build a local demo dApp from the white paper in this empty workspace: React + Vite frontend, Hardhat Solidity contract, simulated IPFS storage, browser AES-GCM encryption, and the v2 Contextual Consent Grammar flow. The MVP will prove patient-owned encrypted records, contextual consent policies, doctor access requests, anomaly flagging, patient grants, audit logging, and local decryption.

## Key Changes
- Scaffold a monorepo with `contracts/`, `test/`, `scripts/`, and `frontend/`.
- Implement `ConsentLedger.sol` with:
  - `ConsentPolicy` containing CID, owner, consumer, role, institution, purpose, prior-care flag, access window, notify-on-access flag, and existence flag.
  - `AccessRequest` containing record ID, requester, request context, status, timestamp, and granted key material.
  - `RecordAdded`, `AccessRequested`, `AccessGranted`, `AccessLogged`, and `ContextualAnomalyFlagged` events.
- Remove public `flagAnomaly`; `requestAccess` emits `ContextualAnomalyFlagged` internally when `purpose == "treatment"` and `priorCare == false`.
- Enforce consent windows on-chain in `requestAccess` using `block.timestamp`; requests outside `windowStart/windowEnd` revert.
- Add discovery helpers:
  - `getRecordsByOwner(address owner)` for patient dashboards.
  - `RecordAdded(recordId, owner)` so the doctor dashboard can discover records through event queries.
- Make `requestAccess(...) external returns (uint256 requestId)` and also emit the request ID in `AccessRequested`.

## Frontend Behavior
- Patient dashboard:
  - Enter medical text, choose attributes/categories, define consumer/context fields, configure consent window, and upload.
  - Encrypt plaintext with AES-GCM in the browser.
  - Store encrypted payload in simulated IPFS.
  - Store compiled CCG policy on-chain.
  - Review access requests, anomaly warnings, and grant access.
- Doctor dashboard:
  - Discover records from `RecordAdded` events.
  - Submit contextual access requests with role, institution, purpose, and prior-care status.
  - View approval status and decrypt granted records.
- CCG utilities:
  - `compilePolicy(uiPolicy)` converts UI policy data into contract parameters.
  - `evaluateRequest(request, standingPolicy)` handles frontend standing-policy simulation and sensitive-category manual review rules.

## Key Handling
- Use demo-only raw AES key grant flow for Phase 1:
  - The patient stores the generated AES key locally for the browser demo.
  - On approval, `grantAccess(requestId, keyMaterial)` stores the raw AES key string on-chain for the approved request.
  - The UI must label this as intentionally insecure demo behavior.
- Do not claim production-grade zero-trust key exchange in this MVP.
- Leave a clear upgrade path for doctor public-key registration or signed-message key exchange.

## Public Interfaces
- Solidity:
  - `addRecord(...)`
  - `requestAccess(uint256 recordId, string role, string institution, string purpose, bool priorCare) returns (uint256 requestId)`
  - `grantAccess(uint256 requestId, string keyMaterial)`
  - `logAccess(uint256 recordId)`
  - `getRecordsByOwner(address owner)`
- Frontend utilities:
  - `generateKey()`
  - `encryptData(plaintext, key)`
  - `decryptData(ciphertext, key)`
  - `uploadToIPFS(ciphertextBuffer)`
  - `fetchFromIPFS(cid)`
  - `compilePolicy(uiPolicy)`
  - `evaluateRequest(request, standingPolicy)`

## Test Plan
- Contract tests:
  - Patient can add a record and retrieve it through `getRecordsByOwner`.
  - `RecordAdded` enables record discovery.
  - `requestAccess` returns a request ID and emits `AccessRequested`.
  - Requests outside the consent window revert.
  - Treatment requests without prior care emit `ContextualAnomalyFlagged`.
  - Only the record owner can grant access.
  - Granted request stores key material and emits `AccessGranted`.
- Utility tests:
  - AES-GCM encrypt/decrypt round trip.
  - Simulated IPFS upload/fetch round trip.
  - CCG compiler maps relationship, dates, notification, and policy fields correctly.
  - Standing policy auto-approval and sensitive-category manual-review behavior.
- Manual acceptance:
  - Start local Hardhat chain and frontend.
  - Patient uploads encrypted record.
  - Doctor discovers record, requests access, and sees pending status.
  - Suspicious request produces anomaly warning.
  - Patient grants access.
  - Doctor decrypts and views the record locally.

## Assumptions
- First implementation is local-demo only.
- Simulated IPFS is used.
- Raw on-chain AES key grant is intentionally insecure and documented as Phase 1 demo behavior.
- No real PHI, real IPFS service, SIWE, RBAC/NFT verification, FHIR adapter, LIT/NuCypher, ABE, or production key exchange in this build.
