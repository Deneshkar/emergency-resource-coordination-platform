import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getVolunteerShifts } from "../services/volunteerService";

function VolunteerDetail() {
  const { id } = useParams();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShifts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getVolunteerShifts(id);
        setShifts(data);
      } catch (err) {
        setError("Failed to load shift history.");
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [id]);

  return (
    <div>
      <Link to="/">← Back to Volunteers</Link>
      <h1>Volunteer Shift History</h1>

      {loading && <p>Loading shifts...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && shifts.length === 0 && (
        <p>No shifts recorded for this volunteer yet.</p>
      )}

      {!loading && !error && shifts.length > 0 && (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.startTime).toLocaleString()}</td>
                <td>{new Date(s.endTime).toLocaleString()}</td>
                <td>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default VolunteerDetail;