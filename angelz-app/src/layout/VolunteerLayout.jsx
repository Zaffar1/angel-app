import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const navItems = [
  { name: "Feeds", path: "/volunteer/feed/all" },
  { name: "Organizations", path: "/volunteer/organization-list" },
  { name: "Missions", path: "/volunteer/mission/all" },
  { name: "Leaderboard", path: "/volunteer/list-with-leaderboard" },
  {
    name: "Create",
    dropdownItems: [
      { name: "Create Post", path: "/volunteer/post/create" },
    ],
  },
];


const VolunteerLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header navItems={navItems} showSearch={false} />
      <main className="flex-1 p-6 mt-[80px]">
        <Outlet />
      </main>
    </div>
  );
}


export default VolunteerLayout
