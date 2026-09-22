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
// approval requires a genuinely evaluated result — APPROVE/REVISE *and*
// at least one tool check. Empty (0-check) or REJECT results stay blocked.
export const canApprove = (result) => {
  const rec = result?.recommendation;
  const checkCount = result?.checks?.length ?? 0;
  return (rec === "APPROVE" || rec === "REVISE") && checkCount > 0;
};

export const approvalBlockReason = (result) => {
  if (!result) return "Run the safety check first — approval requires APPROVE or REVISE";
  if ((result.checks?.length ?? 0) === 0)
    return "Add at least one task and re-run the safety check — approval requires an evaluated result";
  if (result.recommendation === "REJECT")
    return "Blocked: safety gate returned REJECT — fix blockers and re-run the check";
  return null;
};

export const RECOMMENDATIONS = ["APPROVE", "REVISE", "REJECT"];
