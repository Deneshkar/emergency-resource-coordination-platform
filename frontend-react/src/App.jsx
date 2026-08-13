import { BrowserRouter, Routes, Route } from "react-router-dom";
import VolunteerList from "./pages/VolunteerList";
import VolunteerDetail from "./pages/VolunteerDetail";
import AddVolunteer from "./pages/AddVolunteer";


function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: "2rem" }}>
        <Routes>
          <Route path="/" element={<VolunteerList />} />
          <Route path="/volunteers/:id" element={<VolunteerDetail />} />
          <Route path="/volunteers/new" element={<AddVolunteer />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;