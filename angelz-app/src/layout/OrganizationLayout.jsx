import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const navItems = [
  { labelKey: "common:nav.feeds", path: "/organization/feed/all" },
  { labelKey: "common:nav.volunteers", path: "/organization/volunteer-list" },
  { labelKey: "common:nav.missions", path: "/organization/mission/by-organization" },
  { 
    labelKey: "common:nav.create", 
    dropdownItems: [
      { labelKey: "common:nav.createMission", path: "/organization/mission/create" },
      { labelKey: "common:nav.createPost", path: "/organization/post/create" }
    ]
  },
  { labelKey: "common:nav.leaderboard", path: "/organization/list-with-leaderboard" },
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
