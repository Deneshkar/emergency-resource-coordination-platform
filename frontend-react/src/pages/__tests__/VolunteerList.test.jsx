import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VolunteerList from "../VolunteerList";
import * as volunteerService from "../../services/volunteerService";
import * as authContext from "../../context/AuthContext";

vi.mock("../../services/volunteerService", () => ({
  getVolunteers: vi.fn(),
  updateAvailability: vi.fn(),
  deleteAllVolunteers: vi.fn(),
  deleteVolunteer: vi.fn(),
  createVolunteer: vi.fn(),
  getVolunteerShifts: vi.fn(),
}));

function mockCoordinator() {
  vi.spyOn(authContext, "useAuth").mockReturnValue({
    user: { email: "coordinator@ercp.org", role: "Coordinator" },
    hasRole: (roles) => roles.includes("Coordinator"),
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <VolunteerList />
    </MemoryRouter>
  );
}

const sampleVolunteers = [
  {
    id: "vol-1",
    name: "Marcus Vance",
    email: "volunteer@ercp.org",
    phone: "+1-555-0144",
    skills: "Search & Rescue, Medical EMT",
    isAvailable: true,
  },
  {
    id: "vol-2",
    name: "Off Duty Responder",
    email: "off@test.local",
    phone: "000",
    skills: "driving",
    isAvailable: false,
  },
];

// Student 4 — VolunteerList tests.
describe("VolunteerList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCoordinator();
  });

  it("renders volunteers returned by the service", async () => {
    volunteerService.getVolunteers.mockResolvedValue(sampleVolunteers);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Marcus Vance")).toBeInTheDocument();
    });
    expect(screen.getByText("Off Duty Responder")).toBeInTheDocument();
    expect(screen.getByText("volunteer@ercp.org")).toBeInTheDocument();
  });

  it("shows an empty state when no volunteers match", async () => {
    volunteerService.getVolunteers.mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No volunteers found")).toBeInTheDocument();
    });
  });

  it("shows an error when loading fails", async () => {
    volunteerService.getVolunteers.mockRejectedValue(new Error("network down"));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Failed to load volunteers.")).toBeInTheDocument();
    });
  });

  it("coordinator sees management actions", async () => {
    volunteerService.getVolunteers.mockResolvedValue(sampleVolunteers);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("+ Register Volunteer")).toBeInTheDocument();
    });
    expect(screen.getByText("Clear All")).toBeInTheDocument();
    expect(screen.getByText("Mark Unavailable")).toBeInTheDocument();
    expect(screen.getByText("Mark Available")).toBeInTheDocument();
  });
});
