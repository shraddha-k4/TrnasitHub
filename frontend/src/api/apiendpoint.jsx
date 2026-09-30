export const baseUrl = "http://localhost:5000";

//routes of train
export const createtrain = `${baseUrl}/api/trains/createtrain`; //multiples train can add
export const gettrain = `${baseUrl}/api/trains/gettrain`;
export const pushtrain = `${baseUrl}/api/trains/pushtrain`;//one train can add
export const updatetrain = `${baseUrl}/api/trains/:train_number`;

//routes of pmpl bus
export const createpmpl = `${baseUrl}/api/pmpl/createpmpl`;
export const getallpmpl = `${baseUrl}/api/pmpl/getallpmpl`;
export const searchpmpl = `${baseUrl}/api/pmpl/search`;// Search by source and destination


//routes of msrtc bus
export const creatbus = `${baseUrl}/api/msrtcbus/createbus`;
export const getallbus = `${baseUrl}/api/msrtcbus/getallbus`;
export const searchbus = `${baseUrl}/api/msrtcbus/search`;


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
  const url =
    `${searchpmpl}?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`;

  return await apiRequest(url);
};


// ===============================
// MSRTC
// ===============================

export const fetchMSRTC = async () => {
  return await apiRequest(getallbus);
};

export const searchMSRTC = async (source, destination) => {
  const url =
    `${searchbus}?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`;

  return await apiRequest(url);
};