import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

// Custom emergency red marker icon with pin
const createMarkerIcon = () => {
  return L.divIcon({
    className: "ercp-map-pin",
    html: `
      <div style="
        position: relative;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border: 2.5px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.6), 0 0 0 4px rgba(239, 68, 68, 0.2);
        cursor: grab;
      ">
        <span style="transform: rotate(45deg); font-size: 18px; line-height: 1;">📍</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
};

const customPinIcon = createMarkerIcon();

// Helper component for listening to map clicks
function MapEvents({ onSelectLocation }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Helper component to smoothly adjust map center
function MapRecenter({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 1.2 });
    }
  }, [center, map]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// Default fallback coordinates (Colombo, Sri Lanka)
const DEFAULT_CENTER = [6.9271, 79.8612];

export default function LocationPicker({
  location,
  latitude,
  longitude,
  onChangeLocation,
  onChangeCoordinates,
  touched,
  error,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const markerRef = useRef(null);

  const currentCenter =
    latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)
      ? [latitude, longitude]
      : DEFAULT_CENTER;

  // Reverse geocoding function using Nominatim API
  const reverseGeocode = useCallback(
    async (lat, lng) => {
      setGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            onChangeLocation(data.display_name);
          } else {
            onChangeLocation(`Location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
        } else {
          onChangeLocation(`Location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      } catch (err) {
        console.error("Reverse geocode failed:", err);
        if (!location || location.trim() === "") {
          onChangeLocation(`Location at (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      } finally {
        setGeocoding(false);
      }
    },
    [onChangeLocation, location]
  );

  // Handle map click
  const handleSelectLocation = useCallback(
    (lat, lng) => {
      const formattedLat = Number(lat.toFixed(6));
      const formattedLng = Number(lng.toFixed(6));
      onChangeCoordinates({ lat: formattedLat, lng: formattedLng });
      reverseGeocode(formattedLat, formattedLng);
    },
    [onChangeCoordinates, reverseGeocode]
  );

  // Handle marker drag end
  const handleDragEnd = useCallback(() => {
    if (markerRef.current) {
      const marker = markerRef.current;
      const pos = marker.getLatLng();
      const formattedLat = Number(pos.lat.toFixed(6));
      const formattedLng = Number(pos.lng.toFixed(6));
      onChangeCoordinates({ lat: formattedLat, lng: formattedLng });
      reverseGeocode(formattedLat, formattedLng);
    }
  }, [onChangeCoordinates, reverseGeocode]);

  // Handle search location button / submit
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      toast.error("Please enter a location name or city to search.");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          const lat = Number(parseFloat(first.lat).toFixed(6));
          const lng = Number(parseFloat(first.lon).toFixed(6));
          onChangeCoordinates({ lat, lng });
          onChangeLocation(first.display_name);
          toast.success("Location found on map!");
        } else {
          toast.error("Location not found. Try entering a city or landmark.");
        }
      } else {
        toast.error("Search request failed.");
      }
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Failed to connect to search service.");
    } finally {
      setSearching(false);
    }
  };

  // Handle "Use My Location" GPS button
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onChangeCoordinates({ lat, lng });
        reverseGeocode(lat, lng);
        setLocating(false);
        toast.success("GPS location retrieved!");
      },
      (err) => {
        setLocating(false);
        console.warn("Geolocation error:", err);
        toast.error("Could not get your current location. Please select manually on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="location-picker-wrapper">
      {/* Search & GPS Controls */}
      <div className="location-controls-bar">
        <div className="location-search-form">
          <input
            type="text"
            className="form-control location-search-input"
            placeholder="Search city, district, or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch(e);
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary location-search-btn"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? "Searching..." : "🔍 Search"}
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary location-gps-btn"
          onClick={handleUseMyLocation}
          disabled={locating}
        >
          {locating ? "Locating..." : "🎯 Use My Location"}
        </button>
      </div>

      {/* Leaflet Map Container */}
      <div className={`location-map-container ${touched && error ? "map-has-error" : ""}`}>
        <MapContainer
          center={currentCenter}
          zoom={14}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapEvents onSelectLocation={handleSelectLocation} />
          <MapRecenter center={currentCenter} />

          {latitude !== null && longitude !== null && (
            <Marker
              ref={markerRef}
              position={[latitude, longitude]}
              draggable={true}
              eventHandlers={{ dragend: handleDragEnd }}
              icon={customPinIcon}
            >
              <Popup>
                <div style={{ textAlign: "center", minWidth: "160px" }}>
                  <strong style={{ color: "#ef4444" }}>🚨 Emergency Site</strong>
                  <div style={{ fontSize: "12px", marginTop: "4px", color: "#334155" }}>
                    {location || `${latitude}, ${longitude}`}
                  </div>
                  <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                    (Drag pin to refine location)
                  </small>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        {geocoding && (
          <div className="location-map-overlay">
            <span>Fetching address details...</span>
          </div>
        )}
      </div>

      <div className="location-hint">
        💡 <em>Click on the map or drag the 📍 pin to pinpoint the exact emergency site.</em>
      </div>

      {/* Address Text Input (Editable Fallback) */}
      <div className="form-group" style={{ marginTop: "8px" }}>
        <label className="form-label" htmlFor="ri-location">
          Specific Location / Address <span className="req">*</span>
        </label>
        <input
          id="ri-location"
          type="text"
          placeholder="e.g. 742 Evergreen Terrace, Sector 4"
          value={location}
          onChange={(e) => onChangeLocation(e.target.value)}
          className={`form-control ${touched && error ? "input-error" : ""}`}
        />
        {touched && error && <span className="field-error">{error}</span>}
      </div>

      {/* Latitude & Longitude Readouts */}
      <div className="location-coords-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="ri-lat">
            Latitude
          </label>
          <input
            id="ri-lat"
            type="text"
            readOnly
            className="form-control readonly-coord"
            value={latitude !== null && latitude !== undefined ? latitude : "Not selected"}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ri-lng">
            Longitude
          </label>
          <input
            id="ri-lng"
            type="text"
            readOnly
            className="form-control readonly-coord"
            value={longitude !== null && longitude !== undefined ? longitude : "Not selected"}
          />
        </div>
      </div>
    </div>
  );
}
