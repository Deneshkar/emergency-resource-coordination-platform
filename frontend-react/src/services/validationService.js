import { apiGet, apiPost } from "./api";

// Student 4 — Validation/Safety Agent client.
// Mirrors backend ValidationsController (deterministic pre-approval gate):
//   POST /api/validations/dispatch/{id} -> { isValid, recommendation, violations, warnings, checks }
//   GET  /api/validations/tools        -> { agent, role, allowedTools, recommendationValues }

export const validateDispatch = async (dispatchId, options = {}) => {
  const body = {};
  if (options.shelterAllocations) body.shelterAllocations = options.shelterAllocations;
  if (options.inventoryRequests) body.inventoryRequests = options.inventoryRequests;
  if (options.proposedShiftStart) body.proposedShiftStart = options.proposedShiftStart;
  if (options.proposedShiftEnd) body.proposedShiftEnd = options.proposedShiftEnd;
  return apiPost(`/validations/dispatch/${dispatchId}`, body);
};

export const getValidationTools = async () => apiGet("/validations/tools");

export const getValidationHistory = async (dispatchId) =>
  apiGet(`/validations/dispatch/${dispatchId}/history`);

// Student 4 — approval soft-gate rule (mirrors the backend verdict contract):
// approval requires a genuinely evaluated APPROVE result and at least one tool check.
export const canApprove = (result) => {
  const checkCount = result?.checks?.length ?? 0;
  return result?.isValid === true && result?.recommendation === "APPROVE" && checkCount > 0;
};

export const approvalBlockReason = (result) => {
  if (!result) return "Run the safety check first — approval requires an APPROVE result";
  if ((result.checks?.length ?? 0) === 0)
    return "Add at least one task and re-run the safety check — approval requires an evaluated result";
  if (result.isValid !== true || result.recommendation !== "APPROVE")
    return "Blocked: safety gate did not return APPROVE — fix issues and re-run the check";
  return null;
};

export const RECOMMENDATIONS = ["APPROVE", "REVISE", "REJECT"];
