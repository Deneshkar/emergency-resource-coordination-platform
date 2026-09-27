import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DispatchList from "../DispatchList";
import * as authContext from "../../context/AuthContext";
import * as dispatchService from "../../services/dispatchService";
import { incidentService } from "../../services/incidentService";
import * as incidentListService from "../../services/incidentService";
import * as volunteerService from "../../services/volunteerService";
import * as resourceService from "../../services/resourceService";
import * as validationService from "../../services/validationService";

vi.mock("../../services/dispatchService", () => ({
  getDispatches: vi.fn(),
  createDispatch: vi.fn(),
  updateDispatchStatus: vi.fn(),
  createDispatchTask: vi.fn(),
  updateDispatchTask: vi.fn(),
  deleteDispatchTask: vi.fn(),
  proposeAllocation: vi.fn(),
}));

vi.mock("../../services/incidentService", () => ({
  getIncidents: vi.fn(),
  incidentService: { generatePlan: vi.fn() },
}));

vi.mock("../../services/volunteerService", () => ({ getVolunteers: vi.fn() }));
vi.mock("../../services/resourceService", () => ({ getResources: vi.fn() }));
vi.mock("../../services/validationService", () => ({
  validateDispatch: vi.fn(),
  getValidationHistory: vi.fn(),
  canApprove: (result) => result?.isValid === true && result?.recommendation === "APPROVE" && (result?.checks?.length ?? 0) > 0,
  approvalBlockReason: (result) => !result ? "Run the safety check first" : "Safety check must return APPROVE",
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const proposal = {
  id: 91,
  planTitle: "Evacuation allocation",
  planDescription: "Deploy response vehicles and field teams.",
  phase: "Immediate Containment",
  createdAt: "2026-09-26T10:00:00Z",
  dispatchPlan: [{ action: "Deploy Vehicle", resource: "Ambulance 1", location: "Sector 4", reason: "Medical response" }],
  suggestedAssignments: [{ role: "Medic", entityName: "Ava Responder", reason: "Medical skills" }],
  risks: [],
  constraints: [],
};

const pendingDispatch = (overrides = {}) => ({
  id: 5,
  incidentId: 12,
  status: "PendingApproval",
  priority: "High",
  createdAt: "2026-09-26T09:00:00Z",
  tasks: [{ id: 22, volunteerId: "vol-1", resourceId: 3, taskType: "Medical response", status: "Assigned" }],
  allocationProposal: proposal,
  ...overrides,
});

function renderPage() {
  return render(<DispatchList />);
}

describe("DispatchList coordinator workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      hasRole: (roles) => roles.includes("Coordinator"),
    });
    dispatchService.getDispatches.mockResolvedValue([pendingDispatch()]);
    incidentListService.getIncidents.mockResolvedValue([{ id: 12, title: "Warehouse fire" }]);
    volunteerService.getVolunteers.mockResolvedValue([
      { id: "vol-1", name: "Ava Responder", skills: "Medical", isAvailable: true },
      { id: "vol-2", name: "Noah Responder", skills: "Driving", isAvailable: true },
    ]);
    resourceService.getResources.mockResolvedValue([
      { id: 3, name: "Ambulance 1", resourceType: "Vehicle", status: "Available" },
      { id: 4, name: "Rescue Truck", resourceType: "Vehicle", status: "Available" },
    ]);
    validationService.getValidationHistory.mockResolvedValue([]);
  });

  it("requests and displays an allocation proposal", async () => {
    incidentService.generatePlan.mockResolvedValue(proposal);
    dispatchService.proposeAllocation.mockResolvedValue({});
    renderPage();

    await screen.findByText(/Warehouse fire/);
    fireEvent.click(screen.getByRole("button", { name: /Re-run Allocation/ }));

    await waitFor(() => {
      expect(incidentService.generatePlan).toHaveBeenCalledWith(
        12,
        "Prepare an allocation proposal for dispatch #5 at High priority."
      );
      expect(dispatchService.proposeAllocation).toHaveBeenCalledWith(5, 91);
    });
    expect(screen.getByText("Evacuation allocation")).toBeInTheDocument();
    expect(screen.getByText("Deploy Vehicle")).toBeInTheDocument();
    expect(screen.getAllByText("Ava Responder").length).toBeGreaterThan(0);
  });

  it("lets coordinators adjust a task before validating and approving", async () => {
    validationService.validateDispatch.mockResolvedValue({
      isValid: true,
      recommendation: "APPROVE",
      checks: [{ tool: "check_volunteer_availability", passed: true, detail: "Available" }],
      violations: [],
      warnings: [],
    });
    dispatchService.updateDispatchTask.mockResolvedValue({});
    dispatchService.updateDispatchStatus.mockResolvedValue({});
    renderPage();

    await screen.findByText("Evacuation allocation");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const [volunteerSelect, resourceSelect] = screen.getAllByRole("combobox");
    fireEvent.change(volunteerSelect, { target: { value: "vol-2" } });
    fireEvent.change(resourceSelect, { target: { value: "4" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Medical Response, Transport"), { target: { value: "Transport" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Assignment" }));

    await waitFor(() => {
      expect(dispatchService.updateDispatchTask).toHaveBeenCalledWith(5, 22, {
        volunteerId: "vol-2",
        resourceId: 4,
        taskType: "Transport",
      });
    });

    fireEvent.click(await screen.findByRole("button", { name: "Run Safety Check" }));
    await screen.findByTestId("validation-APPROVE");
    expect(screen.getByRole("button", { name: "Approve Proposal" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Approve Proposal" }));
    await waitFor(() => {
      expect(dispatchService.updateDispatchStatus).toHaveBeenCalledWith(5, "Approved");
    });
  });

  it("keeps approval disabled when the safety check recommends revision", async () => {
    validationService.validateDispatch.mockResolvedValue({
      isValid: true,
      recommendation: "REVISE",
      checks: [{ tool: "check_resource_stock", passed: true, detail: "Checked" }],
      violations: [],
      warnings: [{ code: "W0_EMPTY_DISPATCH", message: "Add tasks" }],
    });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Run Safety Check" }));
    await screen.findByTestId("validation-REVISE");
    expect(screen.getByRole("button", { name: "Approve Proposal" })).toBeDisabled();
  });

  it("shows the safety check on post-approval dispatches without an approve button", async () => {
    dispatchService.getDispatches.mockResolvedValue([pendingDispatch({ status: "Assigned", allocationProposal: null })]);
    validationService.validateDispatch.mockResolvedValue({
      isValid: false,
      recommendation: "REJECT",
      checks: [{ tool: "check_volunteer_availability", passed: false, detail: "Unavailable" }],
      violations: [{ code: "V1_VOLUNTEER_UNAVAILABLE", message: "Off-duty", severity: "BLOCKER" }],
      warnings: [],
    });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Run Safety Check" }));
    await screen.findByTestId("validation-REJECT");
    expect(screen.queryByRole("button", { name: "Approve Proposal" })).toBeNull();
  });
});
