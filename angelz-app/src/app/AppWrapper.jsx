import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearCredentials } from "../features/auth/authSlice";
import useUserProfile from "../hooks/useUserProfile";
import Loader from "../components/Loader";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function AppWrapper({ allowedRoles = [], children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, token, isFetching } = useUserProfile();

  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicPath = publicPaths.includes(location.pathname);

  useEffect(() => {
    if (!token) {
      dispatch(clearCredentials());
    }
  }, [token, dispatch]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "token" && !e.newValue) {
        dispatch(clearCredentials());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [dispatch]);

  if (token && !user && isFetching) return <Loader />;

  if (!token) {
    return isPublicPath ? (
      <>
        <div className="fixed top-3 end-3 z-50">
          <LanguageSwitcher className="bg-white/80 shadow-sm backdrop-blur" />
        </div>
        {children}
      </>
    ) : (
      <Navigate to="/login" replace />
    );
  }

  if (isPublicPath) {
    return <Navigate to={`/${user?.type || "organization"}`} replace />;
  }

  const hasRoleAccess =
    !allowedRoles.length || allowedRoles.includes(user?.type);

  if (!hasRoleAccess) {
    return <Navigate to={`/${user?.type}`} replace />;
  }

  return children;
}
