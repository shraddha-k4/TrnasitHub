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


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;