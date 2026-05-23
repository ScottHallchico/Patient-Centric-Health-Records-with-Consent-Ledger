import { describe, expect, it } from "vitest";
import { compilePolicy, evaluateRequest } from "../src/utils/ccg";

describe("CCG utilities", () => {
  it("compiles UI policy fields for the contract", () => {
    const compiled = compilePolicy({
      cid: "simcid-123",
      consumer: {
        did: "0x0000000000000000000000000000000000000001",
        role: "Cardiologist",
        institution: "GeneralHospital"
      },
      attributes: ["cardiac_imaging"],
      purpose: "treatment",
      relationship: "prior_care",
      window: {
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-12-31T00:00:00.000Z"
      },
      notification: "immediate"
    });

    expect(compiled).toMatchObject({
      ipfsHash: "simcid-123",
      role: "Cardiologist",
      institution: "GeneralHospital",
      purpose: "treatment",
      priorCare: true,
      notifyOnAccess: true,
      attributes: ["cardiac_imaging"]
    });
    expect(compiled.windowStart).toBe(1780272000);
    expect(compiled.windowEnd).toBe(1798675200);
  });

  it("auto-approves routine requests and blocks sensitive or anomalous requests", () => {
    const standingPolicy = {
      autoApproveIf: {
        purpose: "treatment",
        relationship: "any"
      },
      alwaysRequireManual: ["psychiatric_notes", "genetic_data"]
    };

    expect(
      evaluateRequest(
        { purpose: "treatment", priorCare: true, attributes: ["ecg_data"] },
        standingPolicy
      ).autoApprove
    ).toBe(true);

    expect(
      evaluateRequest(
        { purpose: "treatment", priorCare: true, attributes: ["genetic_data"] },
        standingPolicy
      ).requiresManualReview
    ).toBe(true);

    const anomalous = evaluateRequest(
      { purpose: "treatment", priorCare: false, attributes: ["cardiac_imaging"] },
      standingPolicy
    );
    expect(anomalous.autoApprove).toBe(false);
    expect(anomalous.isAnomalous).toBe(true);
  });
});
