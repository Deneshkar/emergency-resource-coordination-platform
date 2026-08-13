import { useState, useEffect } from "react";
import { getVolunteers, updateAvailability } from "../services/volunteerService";
import { Link } from "react-router-dom";

function VolunteerList() {
  const [volunteers, setVolunteers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVolunteers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVolunteers(search);
      setVolunteers(data);
    } catch (err) {
      setError("Failed to load volunteers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVolunteers();
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    await updateAvailability(id, !currentStatus);
    fetchVolunteers(); // refresh list after update
  };

  if (loading) return <p>Loading volunteers...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1>Volunteers</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search by name or skill"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {volunteers.length === 0 ? (
        <p>No volunteers found.</p>
      ) : (
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
      )}
    </div>
  );
}

export default VolunteerList;