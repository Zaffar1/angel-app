import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "../App";
import {
  Facilities,
  Home,
  Login,
  Missions,
  MissionDetail,
  User,
  Badges,
  EditBadge,
  CreateBadge,
  Volunteers,
  VolunteerDetail,
  RestaurantDetail,
  AddTerms,
  Bookings,
  UserDetails,
  Areas,
  Kitchens,
  Atmosphere,
  Menu,
  Newsletter,
  VolunteerGroups,
  VolunteerGroupDetail,
} from "../pages";
import { AuthLayout } from "../component";

// // Determine base path based on environment
// const baseURL =
//   import.meta.env.MODE === "production"
//     ? import.meta.env.VITE_BASE_URL_PRODUCTION
//     : import.meta.env.VITE_BASE_URL_LOCAL;

function BaseRouter() {
  return (
    // <BrowserRouter basename={baseURL}>
    <BrowserRouter basename={import.meta.env.MODE === "production" ? "/admin" : "/"} >
      <Routes>
        <Route path="/" element={<App />}>
          {/* Redirect to login if accessing root */}
          <Route index element={<Navigate to="/login" replace />} />
          <Route
            path="dashboard"
            element={
              <AuthLayout authentication={false}>
                <Home />
              </AuthLayout>
            }
          />
          <Route
            path="organizations"
            element={
              <AuthLayout authentication={false}>
                <User />
              </AuthLayout>
            }
          />
          <Route
            path="organizations/:id"
            element={
              <AuthLayout authentication={false}>
                <UserDetails />
              </AuthLayout>
            }
          />
          <Route
            path="missions"
            element={
              <AuthLayout authentication={false}>
                <Missions />
              </AuthLayout>
            }
          />
          <Route
            path="missions/:id"
            element={
              <AuthLayout authentication={false}>
                <MissionDetail />
              </AuthLayout>
            }
          />
          <Route
            path="volunteers/:id"
            element={
              <AuthLayout authentication={false}>
                <VolunteerDetail />
              </AuthLayout>
            }
          />
          <Route
            path="volunteer-groups"
            element={
              <AuthLayout authentication={false}>
                <VolunteerGroups />
              </AuthLayout>
            }
          />
          <Route
            path="volunteer-groups/:id"
            element={
              <AuthLayout authentication={false}>
                <VolunteerGroupDetail />
              </AuthLayout>
            }
          />
          <Route
            path="badges"
            element={
              <AuthLayout authentication={false}>
                <Badges />
              </AuthLayout>
            }
          />
          <Route
            path="badges/create"
            element={
              <AuthLayout authentication={false}>
                <CreateBadge />
              </AuthLayout>
            }
          />
          <Route
            path="badges/edit/:id"
            element={
              <AuthLayout authentication={false}>
                <EditBadge />
              </AuthLayout>
            }
          />
          <Route
            path="facilities"
            element={
              <AuthLayout authentication={false}>
                <Facilities />
              </AuthLayout>
            }
          />
          <Route
            path="areas"
            element={
              <AuthLayout authentication={false}>
                <Areas />
              </AuthLayout>
            }
          />
          <Route
            path="kitchens"
            element={
              <AuthLayout authentication={false}>
                <Kitchens />
              </AuthLayout>
            }
          />
          <Route
            path="atmospheres"
            element={
              <AuthLayout authentication={false}>
                <Atmosphere />
              </AuthLayout>
            }
          />
          <Route
            path="menus"
            element={
              <AuthLayout authentication={false}>
                <Menu />
              </AuthLayout>
            }
          />
          <Route
            path="addterms"
            element={
              <AuthLayout authentication={false}>
                <AddTerms />
              </AuthLayout>
            }
          />
          <Route
            path="volunteers"
            element={
              <AuthLayout authentication={false}>
                <Volunteers />
              </AuthLayout>
            }
          />
          <Route
            path="bookings"
            element={
              <AuthLayout authentication={false}>
                <Bookings />
              </AuthLayout>
            }
          />
          <Route
            path="newsletter"
            element={
              <AuthLayout authentication={false}>
                <Newsletter />
              </AuthLayout>
            }
          />
          {/* Authentication required routes */}
          <Route
            path="login"
            element={
              <AuthLayout authentication={true}>
                <Login />
              </AuthLayout>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default BaseRouter;
