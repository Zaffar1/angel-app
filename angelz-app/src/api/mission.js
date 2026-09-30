import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import api from "./client";
import { showSuccess, showError } from "../utils/toast";

export function useCreateMission(options = {}) {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/mission/create", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Mission created successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Mission creation failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useUpdateMission(options = {}) {
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/mission/${id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Mission updated successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Mission update failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useDeleteMission(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/mission/${id}`);
      return data;
    },
    onSuccess: (data, id) => {
      showSuccess(data?.message || "Mission deleted successfully!");
      queryClient.removeQueries(["mission", id]);
      queryClient.invalidateQueries({ queryKey: ["orgMissions"] });

      options?.onSuccess?.(data, id);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Mission deletion failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useMissionDetail(id, options = {}) {
  return useQuery({
    queryKey: ["mission", id],
    queryFn: async () => {
      const { data } = await api.get(`/mission/${id}`);
      return data;
    },
    enabled: !!id,
    ...options,
  });
}

export function useCanPostMissionMutation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/mission/can-post/${id}`);
      return data;
    },
    onSuccess: (data, id) => {
      queryClient.refetchQueries({ queryKey: ["mission", id] });
      showSuccess(data?.message || "Mission posted successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Mission post failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useAllMissions({ page, limit }) {
  return useQuery({
    queryKey: ["missions", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/mission/list", { params: { page, limit } });
      return data;
    },
    keepPreviousData: true,
  });
}

export function useInfiniteMissions({ limit = 10 }) {
  return useInfiniteQuery({
    queryKey: ["missions", "infinite", limit],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/mission/list", { params: { page: pageParam, limit } });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.totalMissions || lastPage.total || 0;
      const totalPages = lastPage.totalPages || Math.ceil(total / limit);
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
  });
}

export function useAllOrganizationMissions({ page, limit }) {
  return useQuery({
    queryKey: ["orgMissions", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/mission/all", { params: { page, limit } });
      return data;
    },
    keepPreviousData: true,
  });
}

export function useInfiniteOrganizationMissions({ limit = 10 }) {
  return useInfiniteQuery({
    queryKey: ["orgMissions", "infinite", limit],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/mission/all", { params: { page: pageParam, limit } });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total || 0;
      const totalPages = lastPage.totalPages || Math.ceil(total / limit);
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
  });
}

export function useAllFeeds({ page, limit }) {
  return useQuery({
    queryKey: ["feeds", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/mission/all-feeds", { params: { page, limit } });
      return data;
    },
    keepPreviousData: true,
  });
}

export function useInfiniteFeeds({ limit = 10 }) {
  return useInfiniteQuery({
    queryKey: ["feeds", "infinite", limit],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/mission/all-feeds", { params: { page: pageParam, limit } });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total || 0;
      const totalPages = lastPage.totalPages || Math.ceil(total / limit);
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
  });
}

// Mission action apis starts from here
export function useRequestMission(options = {}) {
  return useMutation({
    mutationFn: async (missionId) => {
      const { data } = await api.post("/volunteer/request", { mission_id: missionId });
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Mission request sent successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      showError(err.response?.data?.message || "Failed to send mission request!");
      options?.onError?.(err);
    },
  });
}

export function useCompletionRequest(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const body = typeof payload === "object" ? payload : { mission_id: payload };
      const { data } = await api.post("/volunteer/completion-request", body);
      return data;
    },
    onSuccess: (data, variables) => {
      const missionId = typeof variables === "object" ? variables.mission_id : variables;
      showSuccess(data?.message || "Completion request sent successfully!");
      if (missionId) {
        queryClient.invalidateQueries(["mission", String(missionId)]);
        queryClient.invalidateQueries(["mission", Number(missionId)]);
      }
      queryClient.invalidateQueries(["groupVolunteers"]);
      queryClient.invalidateQueries(["notifications"]);
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      showError(err.response?.data?.message || "Failed to send completion request!");
      options?.onError?.(err);
    },
  });
}

export function useAcceptMissionRequest(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, volunteerId }) => {
      const { data } = await api.post("/mission/accept", { missionId, volunteerId });
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Volunteer request accepted successfully!");
      queryClient.invalidateQueries(["notifications"]);
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      showError(err.response?.data?.message || "Failed to accept volunteer request!");
      options?.onError?.(err);
    },
  });
}

export function useRejectMissionRequest(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, volunteerId }) => {
      const { data } = await api.post("/mission/reject", { missionId, volunteerId });
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Volunteer request rejected successfully!");
      queryClient.invalidateQueries(["notifications"]);
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      showError(err.response?.data?.message || "Failed to reject volunteer request!");
      options?.onError?.(err);
    },
  });
}

export function useStartMission(options = {}) {
  return useMutation({
    mutationFn: async ({ mission_id, volunteer_id }) => {
      const { data } = await api.post("/mission/start", { mission_id, volunteer_id });
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Mission started successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      showError(err.response?.data?.message || "Failed to start mission!");
      options?.onError?.(err);
    },
  });
}

export function useCompleteMission(options = {}) {
  return useMutation({
    mutationFn: async ({ missionId, volunteerId }) => {
      const { data } = await api.post("/mission/complete", { missionId, volunteerId });
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Mission marked as complete!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      showError(err.response?.data?.message || "Failed to mark mission as complete!");
      options?.onError?.(err);
    },
  });
}

export function useRejectMissionCompletion(options = {}) {
  return useMutation({
    mutationFn: async ({ missionId, volunteerId }) => {
      const { data } = await api.post("/mission/reject-completion", { missionId, volunteerId });
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Mission completion rejected!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      showError(err.response?.data?.message || "Failed to reject mission completion!");
      options?.onError?.(err);
    },
  });
}

export function useLikeToggleOnFeedMutation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, type }) => {
      const { data } = await api.post(`/mission/like`, { missionId, type });
      return data;
    },
    onSuccess: (data, missionId) => {
      queryClient.refetchQueries({ queryKey: ["mission", missionId] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      showSuccess(data?.message || "Feed liked successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Feed liked failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useCommentDisableToggleOnFeedByAuthorMutation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }) => {
      const { data } = await api.put(`/mission/comment/${commentId}/toggle`);
      return data;
    },
    onSuccess: (data, commentId) => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      showSuccess(data?.message || "Comment disabled successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Comment disabled failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useAddCommentOnFeedMutation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ missionId, comment, type }) => {
      const { data } = await api.post(`/mission/${missionId}/comment`, { comment, type });
      return data;
    },
    onSuccess: (data, missionId, comment) => {
      queryClient.refetchQueries({ queryKey: ["mission", missionId, comment] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      showSuccess(data?.message || "Comment successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Comment failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useUpdateCommentOnFeedMutation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, comment }) => {
      const { data } = await api.put(`/mission/comment/${commentId}`, { comment });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["mission"]);
      queryClient.invalidateQueries(["feeds"]);
      showSuccess(data?.message || "Comment updated!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Update failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useJoinOrganization(options = {}) {
  return useMutation({
    mutationFn: async (orgId) => {
      const { data } = await api.post(`/volunteer/join/${orgId}`);
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "You successfully join organization!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      showError(err.response?.data?.message || "Failed to join organization!");
      options?.onError?.(err);
    },
  });
}

export function useDeleteCommentOnFeedMission(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }) => {
      const { data } = await api.delete(`/mission/comment/${commentId}`);
      return data;
    },
    onSuccess: (data, id) => {
      showSuccess(data?.message || "Comment deleted successfully!");
      queryClient.invalidateQueries(["mission"]);
      queryClient.invalidateQueries(["feeds"]);

      options?.onSuccess?.(data, id);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Comment deletion failed!";
      showError(msg); options?.onError?.(err);
    },
  });
}

export function useRejectOrganizationInvite(options = {}) {
  return useMutation({
    mutationFn: async (orgId) => {
      const { data } = await api.post(`/volunteer/reject/${orgId}`);
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "You rejected the organization request!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      showError(err.response?.data?.message || "Failed to reject the organization request!");
      options?.onError?.(err);
    },
  });
}