import { useMutation, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from './client';
import { showSuccess, showError } from '../utils/toast';
import { syncInvalidateQueries } from '../utils/querySync';

export function useVolunteerEditProfile(options = {}) {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put("/users/edit-profile", payload);
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Profile updated successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Profile update failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useGetAllVolunteerQuery({ page, limit }) {
  return useQuery({
    queryKey: ["volunteers", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/volunteer/all", { params: { page, limit } });
      return data;
    },
    keepPreviousData: true,
  });
}

export function useInfiniteVolunteers({ limit = 10 }) {
  return useInfiniteQuery({
    queryKey: ["volunteers", "infinite", limit],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/volunteer/all", { params: { page: pageParam, limit } });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.totalVolunteers || lastPage.total || 0;
      const totalPages = lastPage.totalPages || Math.ceil(total / limit);
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
  });
}

export function useGetVolunteerDetail(id, options = {}) {
  return useQuery({
    queryKey: ["volunteer", id],
    queryFn: async () => {
      const { data } = await api.get(`/volunteer/${id}`);
      return data?.volunteer;
    },
    enabled: !!id,
    ...options,
  });
}

export function useGetVolunteerLeaderboardQuery(params = {}, options = {}) {
  const { limit } = params
  console.log(limit, 'limit');

  return useQuery({
    queryKey: ["volunteers", "leaderboard", params],
    queryFn: async () => {
      const { data } = await api.get("/volunteer/leaderboard", { params });
      return data;
    },
    keepPreviousData: true,
    ...options,
  });
}

export function useGetVolunteerOrgLeaderboardQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: ["volunteers", "org-leaderboard", params],
    queryFn: async () => {
      const { data } = await api.get("/volunteer/org-leaderboard", { params });
      return data;
    },
    keepPreviousData: true,
    ...options,
  });
}

export function useGetVolunteerGroupLeaderboardQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: ["volunteers", "group-leaderboard", params],
    queryFn: async () => {
      const { data } = await api.get("/volunteer/group-leaderboard", { params });
      return data;
    },
    keepPreviousData: true,
    ...options,
  });
}

export function useInviteVolunteer(options = {}) {
  return useMutation({
    mutationFn: async (userId) => {
      const { data } = await api.post('/volunteer/invite', { userId });
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || 'Invitation sent successfully!');
      syncInvalidateQueries(["notifications"]);
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Invitation failed!';
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useGetVolunteerGroups() {
  return useQuery({
    queryKey: ["volunteerGroups"],
    queryFn: async () => {
      const { data } = await api.get("/volunteer/volunteer-groups");
      return data?.data || [];
    },
  });
}

export function useGetVolunteerGroupDetail(id) {
  return useQuery({
    queryKey: ["volunteerGroupDetail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/volunteer/volunteer-group/${id}`);
      return data?.data || null;
    },
    enabled: !!id,
  });
}

export function useGetVolunteerGroupVolunteers(id, options = {}) {
  return useQuery({
    queryKey: ["volunteerGroupVolunteers", id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await api.get(`/volunteer/volunteer-group/${id}/volunteers`);
      return data?.data || [];
    },
    enabled: !!id,
    ...options,
  });
}

