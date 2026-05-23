const DEFAULT_SENSITIVE_ATTRIBUTES = ["psychiatric_notes", "genetic_data"];

export function toUnixTimestamp(value) {
  if (typeof value === "number") {
    return Math.floor(value);
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return Math.floor(parsed / 1000);
}

export function compilePolicy(uiPolicy) {
  return {
    ipfsHash: uiPolicy.cid,
    consumer: uiPolicy.consumer.did,
    role: uiPolicy.consumer.role,
    institution: uiPolicy.consumer.institution,
    purpose: uiPolicy.purpose,
    priorCare: uiPolicy.relationship === "prior_care",
    windowStart: toUnixTimestamp(uiPolicy.window.start),
    windowEnd: toUnixTimestamp(uiPolicy.window.end),
    notifyOnAccess: uiPolicy.notification === "immediate",
    attributes: uiPolicy.attributes ?? []
  };
}

export function evaluateRequest(request, standingPolicy = {}) {
  const sensitiveAttributes = standingPolicy.alwaysRequireManual ?? DEFAULT_SENSITIVE_ATTRIBUTES;
  const requestAttributes = request.attributes ?? [];
  const hasSensitiveAttribute = requestAttributes.some((attribute) => sensitiveAttributes.includes(attribute));
  const isAnomalous = request.purpose === "treatment" && !request.priorCare;

  const autoApproveRules = standingPolicy.autoApproveIf ?? {};
  const purposeMatches = !autoApproveRules.purpose || request.purpose === autoApproveRules.purpose;
  const relationshipMatches =
    !autoApproveRules.relationship ||
    autoApproveRules.relationship === "any" ||
    request.relationship === autoApproveRules.relationship ||
    (autoApproveRules.relationship === "prior_care" && request.priorCare);
  const institutionMatches =
    !autoApproveRules.institution ||
    autoApproveRules.institution === request.institution ||
    (Array.isArray(autoApproveRules.institution) && autoApproveRules.institution.includes(request.institution));

  const autoApprove = purposeMatches && relationshipMatches && institutionMatches && !hasSensitiveAttribute && !isAnomalous;

  return {
    autoApprove,
    isAnomalous,
    requiresManualReview: hasSensitiveAttribute || isAnomalous,
    reasons: [
      ...(hasSensitiveAttribute ? ["Sensitive attribute requires manual review"] : []),
      ...(isAnomalous ? ["Treatment request without prior care relationship"] : [])
    ]
  };
}
