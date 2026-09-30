import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const navItems = [
  { name: "Feeds", path: "/organization/feed/all" },
  { name: "Volunteers", path: "/organization/volunteer-list" },
  { name: "Missions", path: "/organization/mission/by-organization" },
  { 
    name: "Create", 
    dropdownItems: [
      { name: "Create Mission", path: "/organization/mission/create" },
      { name: "Create Post", path: "/organization/post/create" }
    ]
  },
  { name: "Leaderboard", path: "/organization/list-with-leaderboard" },
];


const OrganizationLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header navItems={navItems} showSearch={false} />
      <main className="flex-1 p-6  mt-[80px]">
        <Outlet />
      </main>
    </div>
  );
};

export default OrganizationLayout;
