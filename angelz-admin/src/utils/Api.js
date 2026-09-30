import axios from "axios";
import API from "./Config";

const BASE_URL = import.meta.env.VITE_BASE_URL || "";
const API_KEY = import.meta.env.VITE_APP_KEY || "";
// const token = 'RGV8JpfbC9J4vgwkKRZvooC3rQVXIuINJlB2CkF6QgEy9i1qMhTyxWjw5TRs'

// utils/tokenUtils.js

// // Import environment variables
// const BASE_URL_LOCAL = import.meta.env.VITE_BASE_URL_LOCAL; // '/'
// const BASE_URL_PRODUCTION = import.meta.env.VITE_BASE_URL_PRODUCTION; // '/angelz-admin/'

// // Function to get the appropriate token
// export const getToken = () => {
//   // Determine if running locally or in production
//   const isLocal =
//     window.location.origin.includes("localhost") ||
//     window.location.origin.includes("127.0.0.1");

//   // Get the current pathname
//   const path = window.location.pathname;

//   // Determine if the current path is for the admin panel
//   const isAdminPanel = isLocal
//     ? path.startsWith(BASE_URL_LOCAL)
//     : path.startsWith(BASE_URL_PRODUCTION);

//   // Return the appropriate token based on the path
//   return isAdminPanel
//     ? localStorage.getItem("adminToken")
//     : localStorage.getItem("webToken");
// };

export const getListDetails = async (url, params) => {
  console.log(params, "list key")
  try {
    const response = await API.get(`${url}`, {
      params
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching data:", error.response || error.message);
    throw error;
  }
};

export const approveHotel = async (id, params) => {
  try {
    const response = await API.put(`${BASE_URL}admin/approveHotel/${id}`, {
      ...params,
      api_key: API_KEY,
    });

    const data = response.data;

    return data;
  } catch (error) {
    console.error("Error approving hotel:", error.message);
    throw error;
  }
};

export const toggleBlockUnblockHotel = async (id, params) => {
  try {
    const response = await API.put(`${BASE_URL}admin/blockUnblockHotel/${id}`, {
      ...params,
      api_key: API_KEY,
    });

    const data = response.data;

    return data;
  } catch (error) {
    console.error("Error blocking/unblocking hotel:", error.message);
    throw error;
  }
};


export const toggleFeaturedHotel = async (id, params) => {
  try {
    const response = await API.get(`${BASE_URL}admin/featured-toggle/${id}`, {
      ...params,
      api_key: API_KEY,
    });

    const data = response.data;

    return data;
  } catch (error) {
    console.error("Error blocking/unblocking hotel:", error.message);
    throw error;
  }
};


export const Login = async (userData) => {
  try {
    const { email, password } = userData;
    const payload = {
      email,
      password,
    };
    const response = await API.post(`/users/login`, payload);
    console.log(response, 'response in core api');

    return response.data;
  } catch (error) {
    console.error("API Login request failed:", error.response);
    throw error;
  }
};

// Delete
export const deleteItem = async (url) => {
  try {
    const res = await API.delete(url);
    return res.data;
  } catch (error) {
    console.error("Delete failed:", error.response || error.message);
    throw error;
  }
};


// UPDATE (Edit)
export const updateItem = async (url, body) => {
  try {
    const res = await API.put(url, body);
    return res.data;
  } catch (error) {
    console.error("Update failed:", error.response || error.message);
    throw error;
  }
};



/* facilities */
export const getFacilities = async () => {
  try {
    const response = await API.get(`${BASE_URL}facilities`); // No need to include BASE_URL here
    return response.data; // Directly access the data from Axios response
  } catch (error) {
    console.error(
      "Error fetching facilities:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const addFacility = async (facility) => {
  try {
    // Make the POST request to add a new facility
    const response = await API.post(`${BASE_URL}facilities`, facility);

    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error(
      "Error adding facility:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateFacility = async (id, facility) => {
  try {
    // Make the PUT request to update the facility
    const response = await API.put(`${BASE_URL}facilities/${id}`, facility);

    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error(
      "Error updating facility:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const deleteFacility = async (id) => {
  try {
    // Make the DELETE request to delete the facility
    const response = await API.delete(`${BASE_URL}facilities/${id}`);

    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error(
      "Error deleting facility:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/* Areas */

export const getAreas = async () => {
  try {
    // Make the GET request to fetch areas
    const response = await API.get(`${BASE_URL}areas`);
    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error(
      "Error fetching areas:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const addArea = async (area) => {
  try {
    // Make the POST request to add a new area
    const response = await API.post(`${BASE_URL}areas`, area);

    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error("Error adding area:", error.response?.data || error.message);
    throw error;
  }
};

export const updateArea = async (id, area) => {
  try {
    const response = await API.put(`${BASE_URL}areas/${id}`, area);
    return response.data;
  } catch (error) {
    console.error("Error updating areas:", error.message);
    throw error;
  }
};

export const deleteArea = async (id) => {
  try {
    const response = await API.delete(`${BASE_URL}areas/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting areas:", error.message);
    throw error;
  }
};

/* Kitchens */

export const getKitchens = async () => {
  try {
    // Make the GET request to fetch kitchens
    const response = await API.get(`${BASE_URL}kitchens`);
    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error(
      "Error fetching kitchens:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const addKitchen = async (kitchen) => {
  try {
    // Make the POST request to add a new kitchen
    const response = await API.post(`${BASE_URL}kitchens`, kitchen);

    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error(
      "Error adding kitchen:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateKitchen = async (id, kitchen) => {
  try {
    const response = await API.put(`${BASE_URL}kitchens/${id}`, kitchen);
    return response.data;
  } catch (error) {
    console.error("Error updating kitchens:", error.message);
    throw error;
  }
};

export const deleteKitchen = async (id) => {
  try {
    const response = await API.delete(`${BASE_URL}kitchens/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting kitchens:", error.message);
    throw error;
  }
};

/* Atmospheres */

export const getAtmospheres = async () => {
  try {
    // Make the GET request to fetch atmospheres
    const response = await API.get(`${BASE_URL}atmospheres`);
    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error(
      "Error fetching atmospheres:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const addAtmosphere = async (atmosphere) => {
  try {
    // Make the POST request to add a new atmosphere
    const response = await API.post(`${BASE_URL}atmospheres`, atmosphere);

    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error(
      "Error adding atmospheres:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateAtmosphere = async (id, atmosphere) => {
  try {
    const response = await API.put(`${BASE_URL}atmospheres/${id}`, atmosphere);
    return response.data;
  } catch (error) {
    console.error("Error updating atmospheres:", error.message);
    throw error;
  }
};

export const deleteAtmosphere = async (id) => {
  try {
    const response = await API.delete(`${BASE_URL}atmospheres/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting atmospheres:", error.message);
    throw error;
  }
};

/* Menu Types */

export const getMenus = async () => {
  try {
    // Make the GET request to fetch menuTypes
    const response = await API.get(`${BASE_URL}menuTypes`);
    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error(
      "Error fetching menuTypes:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const addMenu = async (menuType) => {
  try {
    // Make the POST request to add a new atmosphere
    const response = await API.post(`${BASE_URL}menuTypes`, menuType);

    // Return the response data
    return response.data;
  } catch (error) {
    // Log the error message and throw it for further handling
    console.error(
      "Error adding menuTypes:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateMenu = async (id, menuType) => {
  try {
    const response = await API.put(`${BASE_URL}menuTypes/${id}`, menuType);
    return response.data;
  } catch (error) {
    console.error("Error updating menuTypes:", error.message);
    throw error;
  }
};

export const deleteMenu = async (id) => {
  try {
    const response = await API.delete(`${BASE_URL}menuTypes/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting menuTypes:", error.message);
    throw error;
  }
};

/* Dashboard cards */
export const getCardsData = async () => {
  const token = localStorage.getItem("adminToken");

  try {
    const response = await axios.get(`${BASE_URL}admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = response.data
    return data;
  } catch (error) {
    throw new Error("Error fetching cards data", error.message);
  }
};

/* Volunteer Groups APIs */
export const getVolunteerGroups = async (params) => {
  try {
    const response = await API.get("/admin/volunteer-groups", { params });
    return response?.data;
  } catch (error) {
    console.error("Error fetching volunteer groups:", error.response || error.message);
    throw error;
  }
};

export const getVolunteerGroupDetail = async (id) => {
  try {
    const response = await API.get(`/admin/volunteer-group/${id}`);
    return response?.data;
  } catch (error) {
    console.error("Error fetching volunteer group details:", error.response || error.message);
    throw error;
  }
};
