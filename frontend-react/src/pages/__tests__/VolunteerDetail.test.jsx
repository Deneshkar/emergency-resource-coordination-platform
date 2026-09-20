import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import VolunteerDetail from "../VolunteerDetail";
import * as volunteerService from "../../services/volunteerService";
import * as authContext from "../../context/AuthContext";

vi.mock("../../services/volunteerService", () => ({
  getVolunteerShifts: vi.fn(),
  createShift: vi.fn(),
}));

const VOLUNTEER_ID = "604bd209-0a4a-40f1-9921-56f37bb98655";

function mockCoordinator() {
  vi.spyOn(authContext, "useAuth").mockReturnValue({
    user: { email: "coordinator@ercp.org", role: "Coordinator" },
    hasRole: (roles) => roles.includes("Coordinator"),
  });
}

function mockVolunteerRole() {
  vi.spyOn(authContext, "useAuth").mockReturnValue({
    user: { email: "volunteer@ercp.org", role: "Volunteer" },
    hasRole: () => false,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/volunteers/${VOLUNTEER_ID}`]}>
      <Routes>
        <Route path="/volunteers/:id" element={<VolunteerDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("VolunteerDetail (Student 4 shift tracking)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("shows the empty state when the volunteer has no shifts", async () => {
    mockCoordinator();
    volunteerService.getVolunteerShifts.mockResolvedValue([]);

    renderPage();

    await waitFor(() => expect(screen.getByText("No shifts recorded")).toBeInTheDocument());
    expect(volunteerService.getVolunteerShifts).toHaveBeenCalledWith(VOLUNTEER_ID);
  });

  it("renders shift rows when shifts exist", async () => {
    mockCoordinator();
    volunteerService.getVolunteerShifts.mockResolvedValue([
      { id: 1, startTime: "2026-09-20T08:00:00Z", endTime: "2026-09-20T16:00:00Z", status: "Scheduled" },
    ]);

    renderPage();

    await waitFor(() => expect(screen.getByText("#1")).toBeInTheDocument());
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });

  it("shows Assign Shift only to coordinators and creates a shift on submit", async () => {
    mockCoordinator();
    volunteerService.getVolunteerShifts.mockResolvedValue([]);
    volunteerService.createShift.mockResolvedValue({ id: 9 });

    renderPage();
    await waitFor(() => expect(screen.getByText("No shifts recorded")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ Assign Shift"));
    expect(screen.getByRole("heading", { name: "Assign Shift" })).toBeInTheDocument();

    const [startInput, endInput] = screen.getAllByDisplayValue("");
    fireEvent.change(startInput, { target: { value: "2026-09-21T08:00" } });
    fireEvent.change(endInput, { target: { value: "2026-09-21T16:00" } });
    fireEvent.click(screen.getByText("Assign Shift", { selector: "button[type='submit']" }));

    await waitFor(() => expect(volunteerService.createShift).toHaveBeenCalled());
    const [callId, body] = volunteerService.createShift.mock.calls[0];
    expect(callId).toBe(VOLUNTEER_ID);
    expect(body.status).toBe("Scheduled");
    expect(new Date(body.endTime) > new Date(body.startTime)).toBe(true);
    // List refreshes after a successful assign
    expect(volunteerService.getVolunteerShifts).toHaveBeenCalledTimes(2);
  });

  it("blocks an invalid window client-side without calling the API", async () => {
    mockCoordinator();
    volunteerService.getVolunteerShifts.mockResolvedValue([]);

    renderPage();
    await waitFor(() => expect(screen.getByText("No shifts recorded")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ Assign Shift"));
    const [startInput, endInput] = screen.getAllByDisplayValue("");
    fireEvent.change(startInput, { target: { value: "2026-09-21T16:00" } });
    fireEvent.change(endInput, { target: { value: "2026-09-21T08:00" } });
    fireEvent.click(screen.getByText("Assign Shift", { selector: "button[type='submit']" }));

    await waitFor(() =>
      expect(screen.getByText("Shift end time must be after start time.")).toBeInTheDocument()
    );
    expect(volunteerService.createShift).not.toHaveBeenCalled();
  });

  it("surfaces server errors inside the modal", async () => {
    mockCoordinator();
    volunteerService.getVolunteerShifts.mockResolvedValue([]);
    volunteerService.createShift.mockRejectedValue({
      response: { data: { message: "Shift end time must be after start time." } },
    });

    renderPage();
    await waitFor(() => expect(screen.getByText("No shifts recorded")).toBeInTheDocument());

    fireEvent.click(screen.getByText("+ Assign Shift"));
    const [startInput, endInput] = screen.getAllByDisplayValue("");
    fireEvent.change(startInput, { target: { value: "2026-09-21T08:00" } });
    fireEvent.change(endInput, { target: { value: "2026-09-21T16:00" } });
    fireEvent.click(screen.getByText("Assign Shift", { selector: "button[type='submit']" }));

    await waitFor(() =>
      expect(screen.getByText("Shift end time must be after start time.")).toBeInTheDocument()
    );
  });

  it("hides Assign Shift from non-coordinator roles", async () => {
    mockVolunteerRole();
    volunteerService.getVolunteerShifts.mockResolvedValue([]);

    renderPage();

    await waitFor(() => expect(screen.getByText("No shifts recorded")).toBeInTheDocument());
    expect(screen.queryByText("+ Assign Shift")).toBeNull();
  });
});
