import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getVolunteers, updateAvailability } from "../services/volunteerService";

function VolunteerList() {
  const location = useLocation();
  const [volunteers, setVolunteers] = useState([]);
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // all | available | unavailable
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || null);

  const fetchVolunteers = async () => {
    setLoading(true);
    setError(null);
    try {
      const isAvailable =
        availabilityFilter === "available" ? true :
        availabilityFilter === "unavailable" ? false : null;

      const data = await getVolunteers(search, isAvailable, page, pageSize);
      setVolunteers(data);
    } catch (err) {
      setError("Failed to load volunteers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, [page, availabilityFilter]);

  // clear success message after a few seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVolunteers();
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    await updateAvailability(id, !currentStatus);
    setSuccessMessage("Availability updated successfully!");
    fetchVolunteers();
  };

  return (
    <div>
      <h1>Volunteers</h1>
      <Link to="/volunteers/new">+ Register New Volunteer</Link>

      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

      <form onSubmit={handleSearch} style={{ margin: "1rem 0", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Search by name or skill"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={availabilityFilter} onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(1); }}>
          <option value="all">All</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading volunteers...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && volunteers.length === 0 && <p>No volunteers found.</p>}

      {!loading && !error && volunteers.length > 0 && (
        <>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Skills</th>
                <th>Available</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map((v) => (
                <tr key={v.id}>
                  <td><Link to={`/volunteers/${v.id}`}>{v.name}</Link></td>
                  <td>{v.email}</td>
                  <td>{v.skills}</td>
                  <td>{v.isAvailable ? "Yes" : "No"}</td>
                  <td>
                    <button onClick={() => handleToggleAvailability(v.id, v.isAvailable)}>
                      {v.isAvailable ? "Mark Unavailable" : "Mark Available"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Page {page}</span>
            <button disabled={volunteers.length < pageSize} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

export default VolunteerList;