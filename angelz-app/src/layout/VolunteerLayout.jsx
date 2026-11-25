import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const navItems = [
  { labelKey: "common:nav.feeds", path: "/volunteer/feed/all" },
  { labelKey: "common:nav.organizations", path: "/volunteer/organization-list" },
  { labelKey: "common:nav.missions", path: "/volunteer/mission/all" },
  { labelKey: "common:nav.leaderboard", path: "/volunteer/list-with-leaderboard" },
  {
    labelKey: "common:nav.create",
    dropdownItems: [
      { labelKey: "common:nav.createPost", path: "/volunteer/post/create" },
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
