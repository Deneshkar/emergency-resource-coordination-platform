import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateDispatch,
  getValidationTools,
  getValidationHistory,
  canApprove,
  approvalBlockReason,
  RECOMMENDATIONS,
} from "../validationService";
import * as api from "../api";

vi.mock("../api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

// Student 4 — Validation/Safety Agent service tests.
describe("validationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validateDispatch posts to the dispatch validation endpoint", async () => {
    const fakeResult = {
      dispatchId: 5,
      isValid: true,
      recommendation: "APPROVE",
      violations: [],
      warnings: [],
      checks: [],
    };
    api.apiPost.mockResolvedValue(fakeResult);

    const result = await validateDispatch(5);

    expect(api.apiPost).toHaveBeenCalledWith("/validations/dispatch/5", {});
    expect(result.recommendation).toBe("APPROVE");
    expect(result.isValid).toBe(true);
  });

  it("validateDispatch forwards shelter, inventory and shift options", async () => {
    api.apiPost.mockResolvedValue({ isValid: false, recommendation: "REVISE" });

    await validateDispatch(7, {
      shelterAllocations: [{ shelterId: 3, incomingCount: 20 }],
      inventoryRequests: [{ inventoryItemId: 9, requestedQty: 10 }],
      proposedShiftStart: "2026-09-20T08:00:00Z",
      proposedShiftEnd: "2026-09-20T16:00:00Z",
    });

    expect(api.apiPost).toHaveBeenCalledWith("/validations/dispatch/7", {
      shelterAllocations: [{ shelterId: 3, incomingCount: 20 }],
      inventoryRequests: [{ inventoryItemId: 9, requestedQty: 10 }],
      proposedShiftStart: "2026-09-20T08:00:00Z",
      proposedShiftEnd: "2026-09-20T16:00:00Z",
    });
  });

  it("getValidationTools exposes the agent allow-list contract", async () => {
    api.apiGet.mockResolvedValue({
      agent: "agent-validation-safety-04",
      allowedTools: [
        "check_volunteer_availability",
        "check_shift_overlap",
        "check_shelter_capacity",
        "check_resource_stock",
      ],
    });

    const tools = await getValidationTools();

    expect(api.apiGet).toHaveBeenCalledWith("/validations/tools");
    expect(tools.allowedTools).toHaveLength(4);
    expect(tools.allowedTools).toContain("check_shift_overlap");
  });

  it("only allows APPROVE / REVISE / REJECT recommendations", () => {
    expect(RECOMMENDATIONS).toEqual(["APPROVE", "REVISE", "REJECT"]);
  });

  it("canApprove requires a valid APPROVE result with at least one check", () => {
    expect(canApprove({ isValid: true, recommendation: "APPROVE", checks: [{ tool: "t", passed: true }] })).toBe(true);
    expect(canApprove({ isValid: true, recommendation: "REVISE", checks: [{ tool: "t", passed: true }] })).toBe(false);
    // Empty (0-check) results never approve — even with APPROVE verdict
    expect(canApprove({ isValid: true, recommendation: "APPROVE", checks: [] })).toBe(false);
    expect(canApprove({ isValid: false, recommendation: "APPROVE", checks: [{ tool: "t", passed: true }] })).toBe(false);
    expect(canApprove({ isValid: false, recommendation: "REJECT", checks: [{ tool: "t", passed: false }] })).toBe(false);
    expect(canApprove(null)).toBe(false);
    expect(canApprove(undefined)).toBe(false);
  });

  it("approvalBlockReason explains each blocked state", () => {
    expect(approvalBlockReason(null)).toMatch(/Run the safety check first/);
    expect(approvalBlockReason({ isValid: true, recommendation: "APPROVE", checks: [] })).toMatch(/Add at least one task/);
    expect(approvalBlockReason({ isValid: false, recommendation: "REJECT", checks: [{ tool: "t" }] })).toMatch(/did not return APPROVE/);
    expect(approvalBlockReason({ isValid: true, recommendation: "APPROVE", checks: [{ tool: "t" }] })).toBeNull();
  });

  it("getValidationHistory fetches persisted audits for a dispatch", async () => {
    api.apiGet.mockResolvedValue([
      { auditId: 3, dispatchId: 5, recommendation: "APPROVE", validatedBy: "Coordinator" },
    ]);

    const history = await getValidationHistory(5);

    expect(api.apiGet).toHaveBeenCalledWith("/validations/dispatch/5/history");
    expect(history).toHaveLength(1);
    expect(history[0].recommendation).toBe("APPROVE");
  });
});
