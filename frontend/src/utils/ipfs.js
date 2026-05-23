import { bytesToHex } from "./encoding";

const memoryStore = new Map();
const STORAGE_PREFIX = "simulated-ipfs:";

function storage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function serialize(payload) {
  return JSON.stringify(payload);
}

async function digestCid(serialized) {
  const bytes = new TextEncoder().encode(serialized);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return `simcid-${bytesToHex(new Uint8Array(digest)).slice(0, 46)}`;
}

export async function uploadToIPFS(ciphertextBuffer) {
  const serialized = serialize(ciphertextBuffer);
  const cid = await digestCid(serialized);

  memoryStore.set(cid, serialized);
  storage()?.setItem(`${STORAGE_PREFIX}${cid}`, serialized);

  return cid;
}

export async function fetchFromIPFS(cid) {
  const serialized = memoryStore.get(cid) ?? storage()?.getItem(`${STORAGE_PREFIX}${cid}`);
  if (!serialized) {
    throw new Error(`No simulated IPFS payload found for CID ${cid}.`);
  }
  return JSON.parse(serialized);
}

export function clearSimulatedIPFS() {
  memoryStore.clear();
}
