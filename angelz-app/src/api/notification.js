// src/api/notification.js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import useUserProfile from "../hooks/useUserProfile";
export function useNotifications(options = {}) {
  const { user } = useUserProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await api.get("/notifications/all");
      return data?.data || [];
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    ...options,
  });

  const markAllAsRead = async () => {
    queryClient.setQueryData(["notifications", user?.id], (prev = []) =>
      prev.map((n) => ({ ...n, status: "read" }))
    );

    try {
      await api.put("/notifications/read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      console.log("Mark all read failed silently", err);
    }
  };

  const unreadCount =
    query.data?.filter((n) => n.status === "unread").length || 0;

  return { ...query, markAllAsRead, unreadCount };
}
