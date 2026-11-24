import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./client";
import { showSuccess, showError } from "../utils/toast";

export function useGetGroupVolunteers(options = {}) {
  return useQuery({
    queryKey: ["groupVolunteers"],
    queryFn: async () => {
      const { data } = await api.get("/volunteer-groups/volunteers");
      return data?.data || [];
    },
    ...options,
  });
}

export function useInviteVolunteerByGroup(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/volunteer-groups/invite", payload);
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Volunteer invited successfully!");
      queryClient.invalidateQueries(["groupVolunteers"]);
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Invitation failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useAssignGroupVolunteersToMission(options = {}) {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/volunteer-groups/assign-mission", payload);
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Volunteers assigned to mission successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Assignment failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useAssignGroupVolunteersToOrganization(options = {}) {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/volunteer-groups/assign-organization", payload);
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || "Volunteers assigned to organization successfully!");
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Assignment failed!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useUpdateGroupVolunteerMissionStatus(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mission_id, volunteer_id, status = "completed" }) => {
      const { data } = await api.post("/volunteer-groups/update-mission-status", { mission_id, volunteer_id, status });
      return data;
    },
    onSuccess: (data, variables) => {
      showSuccess(data?.message || "Volunteer mission status updated successfully!");
      queryClient.invalidateQueries(["groupVolunteers"]);
      queryClient.invalidateQueries(["mission", String(variables.mission_id)]);
      queryClient.invalidateQueries(["notifications"]);
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || "Failed to update mission status!";
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useGetGroupVolunteerById(id, options = {}) {
  return useQuery({
    queryKey: ["groupVolunteer", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/volunteer-groups/volunteers/${id}`);
      return data?.data || null;
    },
    enabled: !!id,
    ...options,
  });
}

