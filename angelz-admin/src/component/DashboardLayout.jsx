import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Breadcrumb from "./Breadcrumb";

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 transition-all duration-500">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main
          className={`px-4 mt-6 w-full min-w-0 overflow-x-hidden flex flex-col justify-between ${
            isSidebarOpen ? "" : ""
          }`}
        >
          <div>
            <Breadcrumb />
            <div>{children}</div>
          </div>
          <p className="text-center text-admin_text_grey mt-4 ">
            &copy; {new Date().getFullYear()} Angelz. All rights reserved.
          </p>
        </main>
      </div>
    </>
  );
};

export default DashboardLayout;
