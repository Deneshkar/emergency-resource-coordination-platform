import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LocationPicker from "../LocationPicker";

// Mock react-leaflet components for jsdom
vi.mock("react-leaflet", () => {
  return {
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ children, eventHandlers }) => (
      <div data-testid="map-marker" onClick={() => eventHandlers?.dragend?.()}>
        {children}
      </div>
    ),
    Popup: ({ children }) => <div data-testid="map-popup">{children}</div>,
    useMap: () => ({
      flyTo: vi.fn(),
      getZoom: () => 14,
      invalidateSize: vi.fn(),
    }),
    useMapEvents: (handlers) => {
      // Expose click handler for test trigger
      window.__mapClick = (lat, lng) => handlers.click?.({ latlng: { lat, lng } });
      return null;
    },
  };
});

describe("LocationPicker Component", () => {
  it("renders search input, GPS button, map, address input, and lat/lng fields", () => {
    const handleChangeLocation = vi.fn();
    const handleChangeCoordinates = vi.fn();

    render(
      <LocationPicker
        location="Independence Square, Colombo"
        latitude={6.9042}
        longitude={79.8647}
        onChangeLocation={handleChangeLocation}
        onChangeCoordinates={handleChangeCoordinates}
        touched={false}
        error=""
      />
    );

    expect(screen.getByPlaceholderText(/search city, district/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use my location/i })).toBeInTheDocument();
    expect(screen.getByTestId("map-container")).toBeInTheDocument();

    const addressInput = screen.getByLabelText(/specific location \/ address/i);
    expect(addressInput).toHaveValue("Independence Square, Colombo");

    expect(screen.getByLabelText(/latitude/i)).toHaveValue("6.9042");
    expect(screen.getByLabelText(/longitude/i)).toHaveValue("79.8647");
  });

  it("triggers map click callback and updates coordinates", () => {
    const handleChangeLocation = vi.fn();
    const handleChangeCoordinates = vi.fn();

    render(
      <LocationPicker
        location=""
        latitude={null}
        longitude={null}
        onChangeLocation={handleChangeLocation}
        onChangeCoordinates={handleChangeCoordinates}
        touched={false}
        error=""
      />
    );

    // Trigger map click event
    if (window.__mapClick) {
      act(() => {
        window.__mapClick(6.9271, 79.8612);
      });
    }

    expect(handleChangeCoordinates).toHaveBeenCalledWith({ lat: 6.9271, lng: 79.8612 });
  });

  it("allows manual editing of address field", () => {
    const handleChangeLocation = vi.fn();
    const handleChangeCoordinates = vi.fn();

    render(
      <LocationPicker
        location="Initial Address"
        latitude={6.9271}
        longitude={79.8612}
        onChangeLocation={handleChangeLocation}
        onChangeCoordinates={handleChangeCoordinates}
        touched={false}
        error=""
      />
    );

    const addressInput = screen.getByLabelText(/specific location \/ address/i);
    fireEvent.change(addressInput, { target: { value: "Manually Edited Address, Colombo 07" } });

    expect(handleChangeLocation).toHaveBeenCalledWith("Manually Edited Address, Colombo 07");
  });
});
