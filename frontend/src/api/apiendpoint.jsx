export const baseUrl = "http://localhost:5000";
// export const baseUrl = "https://trnasithub.onrender.com";

//routes of train
export const createtrain = `${baseUrl}/api/trains/createtrain`; //multiples train can add
export const gettrain = `${baseUrl}/api/trains/gettrain`;
export const pushtrain = `${baseUrl}/api/trains/pushtrain`; //one train can add
export const updatetrain = `${baseUrl}/api/trains/:train_number`;

//routes of pmpl bus
export const createpmpl = `${baseUrl}/api/pmpl/createpmpl`;
export const getallpmpl = `${baseUrl}/api/pmpl/getallpmpl`;
export const searchpmpl = `${baseUrl}/api/pmpl/search`; // Search by source and destination

//routes of msrtc bus
export const creatbus = `${baseUrl}/api/msrtcbus/createbus`;
export const getallbus = `${baseUrl}/api/msrtcbus/getallbus`;
export const searchbus = `${baseUrl}/api/msrtcbus/search`;

//routes of metro (NEW - needed so metro tab is dynamic too)
export const createmetro = `${baseUrl}/api/metro/createmetro`;
export const getallmetro = `${baseUrl}/api/metro/getallmetro`;

export const getallTransitRoutes = `${baseUrl}/api/transit-stops`;
export const pushTransitStope = `${baseUrl}/api/transit-stops/bulk`;

export const allRoutesForC = `${baseUrl}/api/route-planner/all-for-c`;
export const searchRoutePlannerC = `${baseUrl}/api/route-planner/search-c`;

export const fetchAllRoutesForC = async () => {
  try {
    const res = await fetch(allRoutesForC);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { success: true, data: await res.json() };
  } catch (error) {
    console.error("fetchAllRoutesForC error:", error);
    return { success: false, data: null, error: error.message };
  }
};

export const searchRoutesForC = async ({ from, to, departureTime = "", keyword = "" }) => {
  try {
    const params = new URLSearchParams({ from, to, departureTime, keyword });
    const res = await fetch(`${searchRoutePlannerC}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { success: true, data: await res.json() };
  } catch (error) {
    console.error("searchRoutesForC error:", error);
    return { success: false, data: null, error: error.message };
  }
};

export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("Backend API Error:", error.message);

    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};


// export const apiRequest = async (url, options = {}) => {
//   try {
//     const response = await fetch(url, {
//       ...options,
//       headers: {
//         "Content-Type": "application/json",
//         ...(options.headers || {})
//       }
//     });

//     if (!response.ok) {
//       throw new Error(`API Error: ${response.status}`);
//     }

//     const data = await response.json();

//     return {
//       success: true,
//       data
//     };
//   } catch (error) {
//     console.error("Backend API Error:", error.message);

//     return {
//       success: false,
//       data: null,
//       error: error.message
//     };
//   }
// };

// ===============================
// TRAIN
// ===============================

export const fetchTrains = async () => {
  return await apiRequest(gettrain);
};

// ===============================
// PMPL
// ===============================

export const fetchPMPL = async () => {
  return await apiRequest(getallpmpl);
};

export const searchPMPL = async (source, destination) => {
  const url = `${searchpmpl}?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`;

  return await apiRequest(url);
};

// ===============================
// MSRTC
// ===============================

export const fetchMSRTC = async () => {
  return await apiRequest(getallbus);
};

export const searchMSRTC = async (source, destination) => {
  const url = `${searchbus}?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`;

  return await apiRequest(url);
};

// ===============================
// METRO
// ===============================

export const fetchMetro = async () => {
  return await apiRequest(getallmetro);
};
// Add this inside your ../api/apiendpoint.jsx file
export const fetchRoutesForC = async (source, destination, departureTime = "", keyword = "") => {
  try {
    const params = new URLSearchParams();
    if (source) params.append("from", source);
    if (destination) params.append("to", destination);
    if (departureTime) params.append("time", departureTime);
    if (keyword) params.append("keyword", keyword);

    const response = await fetch(`${baseUrl}/api/route-planner/all-for-c?${params.toString()}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.p("Error fetching routes from C backend:", error);
    return { success: false, error };
  }
};
