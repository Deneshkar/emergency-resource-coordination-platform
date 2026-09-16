import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateDispatch, getValidationTools, RECOMMENDATIONS } from "../validationService";
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
});
