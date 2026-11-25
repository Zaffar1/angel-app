import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const navItems = [
  { labelKey: "common:nav.feeds", path: "/volunteer_group/feed/all" },
  { labelKey: "common:nav.missions", path: "/volunteer_group/mission/all" },
  { labelKey: "common:nav.organizations", path: "/volunteer_group/organization-list" },
  { labelKey: "common:nav.invitedVolunteers", path: "/volunteer_group/volunteers" },
  { labelKey: "common:nav.leaderboard", path: "/volunteer_group/list-with-leaderboard" },
  { labelKey: "common:nav.editProfile", path: "/volunteer_group/edit" },
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
