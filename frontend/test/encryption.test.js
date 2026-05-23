import { describe, expect, it } from "vitest";
import { decryptData, encryptData, generateKey } from "../src/utils/encryption";

describe("encryption utilities", () => {
  it("round trips plaintext with AES-GCM", async () => {
    const key = await generateKey();
    const encrypted = await encryptData("cardiac MRI notes", key);
    const decrypted = await decryptData(encrypted, key);

    expect(encrypted.algorithm).toBe("AES-256-GCM");
    expect(encrypted.ciphertext).not.toContain("cardiac MRI notes");
    expect(decrypted).toBe("cardiac MRI notes");
  });
});
