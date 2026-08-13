import { BrowserRouter, Routes, Route } from "react-router-dom";
import VolunteerList from "./pages/VolunteerList";
import VolunteerDetail from "./pages/VolunteerDetail";

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: "2rem" }}>
        <Routes>
          <Route path="/" element={<VolunteerList />} />
          <Route path="/volunteers/:id" element={<VolunteerDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;