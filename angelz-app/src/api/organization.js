import { useMutation, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from './client';
import { showSuccess, showError } from '../utils/toast';

export function useOrganizationEditProfile(options = {}) {
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

export function useGetAllOrganizationQuery({ page, limit }) {
  return useQuery({
    queryKey: ["organizations", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/organization/all", {
        params: { page, limit }
      });
      return data;
    },
    keepPreviousData: true,
  })
}

export function useInfiniteOrganizations({ limit = 10 }) {
  return useInfiniteQuery({
    queryKey: ["organizations", "infinite", limit],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/organization/all", { params: { page: pageParam, limit } });
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

export function useGetOrganizationDetail(id, options = {}) {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      const { data } = await api.get(`/organization/${id}`);
      return data?.organization;
    },
    enabled: !!id,
    ...options,
  });
}