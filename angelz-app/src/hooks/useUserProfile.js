import { useSelector } from "react-redux";
import { useUserProfile as userProfileAuth } from "../api/auth";

export default function useUserProfile() {
    const { token, user: storedUser } = useSelector((s) => s.auth);
    const query = userProfileAuth(Boolean(token));    
    return {
        user: query?.data?.userDetails || query?.data || storedUser || null,
        token,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        refetch: query.refetch,
    };
}