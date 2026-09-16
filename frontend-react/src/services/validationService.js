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

export const RECOMMENDATIONS = ["APPROVE", "REVISE", "REJECT"];
