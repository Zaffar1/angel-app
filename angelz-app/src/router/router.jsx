import { createBrowserRouter, Navigate } from "react-router-dom";
import ScrollLayout from "../components/ScrollToTop";
import NotFound from "../components/NotFound";
import { BASE_URL } from "../utils/envConfig";

// Wrappers & Layouts
import AppWrapper from "../app/AppWrapper";
import OrganizationLayout from "../layout/OrganizationLayout";
import VolunteerLayout from "../layout/VolunteerLayout";
import VolunteerGroupLayout from "../layout/VolunteerGroupLayout";

// Auth
import Login from "../features/auth/Login";
import Register from "../features/auth/Register";
import ForgotPassword from "../features/auth/ForgotPassword";
import ResetPassword from "../features/auth/ResetPassword";
import ChangePassword from "../features/auth/ChangePassword";

// Features
import {
    AddMissionForm,
    EditMissionForm,
    MissionDetails,
    MissionListForAll,
    MissionsByOrganization,
} from "../features/mission";
import {
    EditOrganizationForm,
    OrganizationDetail,
    OrganizationList,
} from "../features/organization";
import {
    EditVolunteerForm,
    VolunteerDetail,
    VolunteerList,
    VolunteerListWithLeaderBoard,
    LeaderboardEmbedPage,
} from "../features/volunteer";
import { FeedList } from "../features/feeds";
import { CreatePost } from "../features/Post";
import EditVolunteerGroupForm from "../features/volunteer-group/EditVolunteerGroupForm";
import VolunteerGroupDetail from "../features/volunteer-group/VolunteerGroupDetail";
import GroupVolunteersList from "../features/volunteer-group/GroupVolunteersList";
import VolunteerGroupDetailForOrg from "../features/volunteer-group/VolunteerGroupDetailForOrg";

const postRoutes = [
    { path: "post/create", element: <CreatePost />, roles: ["organization", "volunteer"] },
];

const missionRoutes = [

    { path: "mission/create", element: <AddMissionForm />, roles: ["organization"] },
    { path: "mission/by-organization", element: <MissionsByOrganization />, roles: ["organization"] },
    { path: "mission/edit/:id", element: <EditMissionForm />, roles: ["organization"] },
    { path: "mission/all", element: <MissionListForAll />, roles: ["volunteer", "volunteer_group"] },
    { path: "mission/:id", element: <MissionDetails />, roles: ["organization", "volunteer", "volunteer_group"] },
];

const feedRoutes = [
    { path: "feed/all", element: <FeedList />, roles: ["organization", "volunteer", "volunteer_group"] },
];

const filterRoutesByRole = (role, ...groups) =>
    groups.flat().filter((r) => r.roles.includes(role)).map(({ roles, ...rest }) => rest);

const volunteerGroupRoutes = [
    { index: true, element: <Navigate to="edit" replace /> },
    { path: "edit", element: <EditVolunteerGroupForm /> },
    { path: "profile", element: <VolunteerGroupDetail /> },
    { path: "change-password", element: <ChangePassword /> },
    { path: "volunteers", element: <GroupVolunteersList /> },
    { path: "list-with-leaderboard", element: <VolunteerListWithLeaderBoard /> },
    { path: "organization-list", element: <OrganizationList /> },
    { path: "organization/:id", element: <OrganizationDetail /> },
    ...filterRoutesByRole("volunteer_group", missionRoutes, feedRoutes),
    { path: "*", element: <NotFound section="volunteer_group" /> },
];

const organizationRoutes = [
    { index: true, element: <Navigate to="edit" replace /> },
    { path: "edit", element: <EditOrganizationForm /> },
    { path: "profile", element: <OrganizationDetail /> },
    { path: "change-password", element: <ChangePassword /> },
    { path: "volunteer-list", element: <VolunteerList /> },
    { path: "volunteer/:id", element: <VolunteerDetail /> },
    { path: "volunteer-group/:id", element: <VolunteerGroupDetailForOrg /> },
    { path: "list-with-leaderboard", element: <VolunteerListWithLeaderBoard /> },
    ...filterRoutesByRole("organization", missionRoutes, feedRoutes, postRoutes),
    { path: "*", element: <NotFound section="organization" /> },
];

const volunteerRoutes = [
    { index: true, element: <Navigate to="edit" replace /> },
    { path: "edit", element: <EditVolunteerForm /> },
    { path: "profile", element: <VolunteerDetail /> },
    { path: "change-password", element: <ChangePassword /> },
    { path: "organization-list", element: <OrganizationList /> },
    { path: "list-with-leaderboard", element: <VolunteerListWithLeaderBoard /> },
    { path: "organization/:id", element: <OrganizationDetail /> },
    ...filterRoutesByRole("volunteer", missionRoutes, feedRoutes, postRoutes),

    { path: "*", element: <NotFound section="volunteer" /> },
];

const routes = [
    {
        element: <ScrollLayout />,
        children: [
            { index: true, element: <AppWrapper><Navigate to="/login" replace /></AppWrapper> },
            // Public standalone route — no auth, safe to iframe on any website
            { path: "leaderboard/embed", element: <LeaderboardEmbedPage /> },
            { path: "login", element: <AppWrapper><Login /></AppWrapper> },
            { path: "register", element: <AppWrapper><Register /></AppWrapper> },
            { path: "forgot-password", element: <AppWrapper><ForgotPassword /></AppWrapper> },
            { path: "reset-password", element: <AppWrapper><ResetPassword /></AppWrapper> },
            {
                path: "organization",
                element: (
                    <AppWrapper allowedRoles={["organization"]}>
                        <OrganizationLayout />
                    </AppWrapper>
                ),
                children: organizationRoutes,
            },
            {
                path: "volunteer",
                element: (
                    <AppWrapper allowedRoles={["volunteer"]}>
                        <VolunteerLayout />
                    </AppWrapper>
                ),
                children: volunteerRoutes,
            },
            {
                path: "volunteer_group",
                element: (
                    <AppWrapper allowedRoles={["volunteer_group"]}>
                        <VolunteerGroupLayout />
                    </AppWrapper>
                ),
                children: volunteerGroupRoutes,
            },
            { path: "*", element: <NotFound /> },
        ],
    },
];

export const router = createBrowserRouter(routes, { basename: BASE_URL });
