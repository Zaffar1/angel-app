// rootReducer.js
import { combineReducers } from '@reduxjs/toolkit';
import HomeSlice from './homeSlice';
import AuthSlice from './authSlice';
// import bookingSlice from './bookingSlice';

const rootReducer = combineReducers({
  home: HomeSlice,
  auth: AuthSlice,
//   bookings: bookingSlice
});

export default rootReducer;
