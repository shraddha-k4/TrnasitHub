// import { useState } from 'react'



// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       Hello
//     </>
//   )
// }

// export default App


import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../src/user/home.jsx";
import HomePage from "./pages/HomePage.jsx";
import RoutePlannerPage from "./pages/RoutePlannerPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import TimetablesPage from "./pages/TimetablesPage.jsx";
import LiveTrackPage from "./pages/LiveTrackPage.jsx";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/route-planner" element={<RoutePlannerPage />} />
        <Route path="/timetables" element={<TimetablesPage />} />
        <Route path="/live-track" element={<LiveTrackPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;