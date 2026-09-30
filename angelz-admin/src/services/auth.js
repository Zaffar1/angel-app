import API from "../utils/Config";

export const Login = async (userData) => {
  const { email, password } = userData;
  const payload = { email, password };

  try {
    const response = await API.post("/users/login", payload);
    return response.data;
  } catch (err) {
    // Fallback: if server router is case-sensitive and mounted as /users/Login
    if (err?.response?.status === 404) {
      const response = await API.post("/users/Login", payload);
      return response.data;
    }
    throw err;
  }
};