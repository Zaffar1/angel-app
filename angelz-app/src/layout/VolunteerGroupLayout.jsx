import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const navItems = [
  { name: "Feeds", path: "/volunteer_group/feed/all" },
  { name: "Missions", path: "/volunteer_group/mission/all" },
  { name: "Organizations", path: "/volunteer_group/organization-list" },
  { name: "Invited Volunteers", path: "/volunteer_group/volunteers" },
  { name: "Leaderboard", path: "/volunteer_group/list-with-leaderboard" },
  { name: "Edit Profile", path: "/volunteer_group/edit" },
];

const VolunteerGroupLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header navItems={navItems} showSearch={false} />
      <main className="flex-1 p-6 mt-[80px]">
        <Outlet />
      </main>
    </div>
  );
}

export default VolunteerGroupLayout;
