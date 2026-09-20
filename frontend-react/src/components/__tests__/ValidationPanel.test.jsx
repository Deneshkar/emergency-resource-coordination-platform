import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ValidationPanel from "../ValidationPanel";

const approveResult = {
  dispatchId: 1,
  isValid: true,
  recommendation: "APPROVE",
  violations: [],
  warnings: [],
  checks: [
    { tool: "check_volunteer_availability", passed: true, detail: "Volunteer Marcus Vance available=True." },
  ],
  validatedAt: "2026-09-20T10:00:00Z",
  validatedBy: "Coordinator",
  auditId: 7,
  durationMs: 12,
};

const rejectResult = {
  dispatchId: 2,
  isValid: false,
  recommendation: "REJECT",
  violations: [
    { code: "V1_VOLUNTEER_UNAVAILABLE", message: "Volunteer is off-duty.", severity: "BLOCKER" },
  ],
  warnings: [
    { code: "W1_SKILL_MISMATCH", message: "Missing skill: medical.", severity: "WARNING" },
  ],
  checks: [
    { tool: "check_volunteer_availability", passed: false, detail: "Volunteer Off Duty available=False." },
  ],
  validatedAt: "2026-09-20T11:00:00Z",
  validatedBy: "Coordinator",
  auditId: 8,
  durationMs: 9,
};

describe("ValidationPanel (Student 4 safety gate)", () => {
  it("shows empty hint when no check has run", () => {
    render(<ValidationPanel result={null} loading={false} error={null} />);
    expect(screen.getByTestId("validation-empty")).toHaveTextContent("No safety check run yet");
  });

  it("renders APPROVE with checks and audit metadata", () => {
    render(<ValidationPanel result={approveResult} loading={false} error={null} history={[]} />);
    expect(screen.getByTestId("validation-APPROVE")).toBeInTheDocument();
    expect(screen.getByText("APPROVE")).toBeInTheDocument();
    expect(screen.getByText(/check_volunteer_availability/)).toBeInTheDocument();
    expect(screen.getByText(/audit #7/)).toBeInTheDocument();
  });

  it("renders REJECT blockers and warnings", () => {
    render(<ValidationPanel result={rejectResult} loading={false} error={null} history={[]} />);
    expect(screen.getByTestId("validation-REJECT")).toBeInTheDocument();
    expect(screen.getByText("V1_VOLUNTEER_UNAVAILABLE")).toBeInTheDocument();
    expect(screen.getByText("W1_SKILL_MISMATCH")).toBeInTheDocument();
  });

  it("shows no-tasks hint when the result has zero checks", () => {
    const emptyResult = { ...approveResult, checks: [] };
    render(<ValidationPanel result={emptyResult} loading={false} error={null} history={[]} />);
    expect(screen.getByTestId("validation-no-tasks-hint")).toHaveTextContent("No tasks assigned");
  });

  it("hides no-tasks hint when checks exist", () => {
    render(<ValidationPanel result={approveResult} loading={false} error={null} history={[]} />);
    expect(screen.queryByTestId("validation-no-tasks-hint")).toBeNull();
  });

  it("shows loading and error states with retry", () => {
    const { rerender } = render(<ValidationPanel result={null} loading error={null} />);
    expect(screen.getByTestId("validation-loading")).toHaveTextContent("Running safety checks");

    const onRerun = vi.fn();
    rerender(<ValidationPanel result={null} loading={false} error="403 Forbidden" onRerun={onRerun} />);
    expect(screen.getByTestId("validation-error")).toHaveTextContent("403 Forbidden");
    fireEvent.click(screen.getByText("Retry safety check"));
    expect(onRerun).toHaveBeenCalled();
  });
});
