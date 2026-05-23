import { base64ToBytes, bytesToBase64 } from "./encoding";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getCrypto() {
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.subtle) {
    throw new Error("Web Crypto API is required for demo encryption.");
  }
  return webCrypto;
}

async function importAesKey(keyMaterial) {
  return getCrypto().subtle.importKey(
    "raw",
    base64ToBytes(keyMaterial),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function generateKey() {
  const rawKey = new Uint8Array(32);
  getCrypto().getRandomValues(rawKey);
  return bytesToBase64(rawKey);
}

export async function encryptData(plaintext, keyMaterial) {
  const key = await importAesKey(keyMaterial);
  const iv = new Uint8Array(12);
  getCrypto().getRandomValues(iv);

  const ciphertext = await getCrypto().subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    algorithm: "AES-256-GCM",
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext))
  };
}

export async function decryptData(payload, keyMaterial) {
  const key = await importAesKey(keyMaterial);
  const plaintext = await getCrypto().subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(payload.iv) },
    key,
    base64ToBytes(payload.ciphertext)
  );
  return decoder.decode(plaintext);
}
