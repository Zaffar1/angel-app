import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ScrollToTop, DashboardLayout } from "./component";

// Import all of Bootstrap's CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.js";

function App() {
  const location = useLocation();
  const hideHeaderFooterRoutes = ["/login", "/signup"];
  const userData = useSelector((state) => state.auth.userData);

  const shouldHideHeaderFooter = hideHeaderFooterRoutes.includes(
    location.pathname
  );
  return (
    <>
      <div className="bg-slate-100 min-h-screen flex flex-col">
        <ScrollToTop />
        {shouldHideHeaderFooter ? (
          <main className="relative">
            <Outlet />
          </main>
        ) : (
          <DashboardLayout>
            <Outlet />
          </DashboardLayout>
        )}
      </div>
    </>
  );
}

export default App;
