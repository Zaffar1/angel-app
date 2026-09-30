// src/api/notification.js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import useUserProfile from "../hooks/useUserProfile";
import { useSocket } from "../hooks/useSocket";

export function useNotifications() {
  const { user } = useUserProfile();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await api.get("/notifications/all");
      return data?.data || [];
    },
    refetchOnWindowFocus: true,
  });

  useSocket((data) => {
    if (!user?.id || !data?.id) return;

    queryClient.setQueryData(["notifications", user?.id], (prev = []) => {
      const exists = prev.some((n) => n.id === data.id);
      return exists ? prev : [data, ...prev];
    });
  });

  const markAllAsRead = async () => {
    queryClient.setQueryData(["notifications", user?.id], (prev = []) =>
      prev.map((n) => ({ ...n, status: "read" }))
    );

    try {
      await api.put("/notifications/read");
      queryClient.invalidateQueries(["notifications", user?.id]);
    } catch (err) {
      console.log("Mark all read failed silently", err);
    }
  };

  const unreadCount =
    query.data?.filter((n) => n.status === "unread").length || 0;

  return { ...query, markAllAsRead, unreadCount };
}
