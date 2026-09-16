import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AddVolunteer from "../AddVolunteer";
import * as volunteerService from "../../services/volunteerService";

vi.mock("../../services/volunteerService", () => ({
  createVolunteer: vi.fn(),
  getVolunteers: vi.fn(),
  updateAvailability: vi.fn(),
  getVolunteerShifts: vi.fn(),
  deleteAllVolunteers: vi.fn(),
  deleteVolunteer: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AddVolunteer />
    </MemoryRouter>
  );
}

// Student 4 — AddVolunteer (volunteer registration) tests.
describe("AddVolunteer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all registration fields", () => {
    renderPage();

    expect(screen.getByText("Register Volunteer", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Amara Perera")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("amara@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("+94 77 123 4567")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. medical, driving, rescue")).toBeInTheDocument();
  });

  it("submits the form and navigates with a success message", async () => {
    volunteerService.createVolunteer.mockResolvedValue({ id: "vol-1" });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("e.g. Amara Perera"), {
      target: { value: "Amara Perera" },
    });
    fireEvent.change(screen.getByPlaceholderText("amara@email.com"), {
      target: { value: "amara@email.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("+94 77 123 4567"), {
      target: { value: "+94771234567" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. medical, driving, rescue"), {
      target: { value: "medical, driving" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Register Volunteer" }));

    await waitFor(() => {
      expect(volunteerService.createVolunteer).toHaveBeenCalledWith({
        name: "Amara Perera",
        email: "amara@email.com",
        phone: "+94771234567",
        skills: "medical, driving",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/volunteers", {
        state: { successMessage: "Volunteer registered successfully!" },
      });
    });
  });

  it("shows an error when registration fails", async () => {
    volunteerService.createVolunteer.mockRejectedValue(new Error("duplicate email"));
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("e.g. Amara Perera"), {
      target: { value: "Duplicate User" },
    });
    fireEvent.change(screen.getByPlaceholderText("amara@email.com"), {
      target: { value: "dupe@email.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("+94 77 123 4567"), {
      target: { value: "000" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. medical, driving, rescue"), {
      target: { value: "rescue" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Register Volunteer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to register volunteer. Please check the details and try again.")
      ).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
