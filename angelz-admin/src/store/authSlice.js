import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Login as ApiLogin } from "../services/auth";

const initialState = {
  status: false,
  userData: null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (userData, { rejectWithValue }) => {
    try {
      const { email, password } = userData;
      const response = await ApiLogin({ email, password });
      return {
        ...response,
      };
    } catch (error) {
      console.error(
        "Authentication Error:",
        error.code,
        error.message
      );
      return rejectWithValue(error.response?.data?.message || error.message || "Login failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.status = true;
      state.userData = action.payload.userData; // Set userData from action payload
    },
    logout: (state) => {
      state.status = false;
      state.userData = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem("adminToken");
    },
    loading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = true;
        state.userData = action.payload;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { login, logout, loading } = authSlice.actions;

export default authSlice.reducer;
