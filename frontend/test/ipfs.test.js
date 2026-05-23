import { describe, expect, it } from "vitest";
import { clearSimulatedIPFS, fetchFromIPFS, uploadToIPFS } from "../src/utils/ipfs";

describe("simulated IPFS utilities", () => {
  it("uploads and fetches encrypted payloads by CID", async () => {
    clearSimulatedIPFS();
    const payload = { algorithm: "AES-256-GCM", iv: "iv", ciphertext: "ciphertext" };

    const cid = await uploadToIPFS(payload);
    const fetched = await fetchFromIPFS(cid);

    expect(cid).toMatch(/^simcid-/);
    expect(fetched).toEqual(payload);
  });
});
