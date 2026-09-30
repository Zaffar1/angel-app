import React from "react";
import { useParams } from "react-router-dom";
import {
    VolunteerProfileHeader,
    VolunteerProfileInfo,
    VolunteerProfileTabs,
} from "../../components/volunteer";
import useUserProfile from "../../hooks/useUserProfile";
import { useGetVolunteerDetail } from "../../api/volunteer";
import Loader from "../../components/Loader";

const VolunteerDetail = () => {
    const { id } = useParams();
    const { user, isLoading: profileLoading } = useUserProfile();
    const {
        data: volunteerData,
        isLoading: volunteerLoading,
        isError,
        error,
    } = useGetVolunteerDetail(id);

    const isViewingOther = Boolean(id);
    const volunteer = isViewingOther ? volunteerData : user;
    const isLoading = isViewingOther ? volunteerLoading : profileLoading;

    if (isLoading) return <Loader />

    if (isError)
        return (
            <div className="min-h-screen flex items-center justify-center text-red-500">
                Failed to load profile: {error?.response?.data?.message || error.message}
            </div>
        );

    if (!volunteer) return null;

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white shadow-md rounded-lg p-6">
                    <VolunteerProfileHeader volunteer={volunteer} />
                    <VolunteerProfileInfo volunteer={volunteer} />
                </div>
                <VolunteerProfileTabs volunteer={volunteer} />
            </div>
        </div>
    );
};

export default VolunteerDetail;
