import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getListDetails } from "../utils/Api";

// Define the async thunk for fetching API data
export const fetchApiData = createAsyncThunk(
  "home/fetchApiData",
  async ({ url, params = {}, token }, { rejectWithValue }) => {
    try {
      const data = await getListDetails(url, params, token);
      return { url, data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create the slice
const homeSlice = createSlice({
  name: "home",
  initialState: {
    data: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApiData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApiData.fulfilled, (state, action) => {
        const { url, data } = action.payload;
        state.data[url] = data; // Store data directly under the URL key
        state.loading = false;
      })
      .addCase(fetchApiData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export the reducer
export default homeSlice.reducer;
