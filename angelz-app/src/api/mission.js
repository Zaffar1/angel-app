import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import api from "./client";
import i18n from "../i18n";
import { showSuccess, showError } from "../utils/toast";
import { syncInvalidateQueries } from "../utils/querySync";

export function useCreateMission(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/mission/create", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data?.message || i18n.t("missionDetails:toast.created"));
      queryClient.invalidateQueries({ queryKey: ["orgMissions"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["missions"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["feeds"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["all-posts"], refetchType: "all" });
      queryClient.resetQueries({ queryKey: ["orgMissions"] });
      queryClient.resetQueries({ queryKey: ["missions"] });
      queryClient.resetQueries({ queryKey: ["feeds"] });
      syncInvalidateQueries(["feeds", "all-posts"], ["feeds"], ["all-posts"], ["missions"], ["orgMissions"]);
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || i18n.t("missionDetails:toast.createFailed");
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useUpdateMission(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/mission/${id}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data, variables) => {
      const id = variables?.id;
      showSuccess(data?.message || i18n.t("missionDetails:toast.updated"));
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["mission", String(id)] });
        queryClient.invalidateQueries({ queryKey: ["mission", Number(id)] });
      }
      syncInvalidateQueries(["missions"], ["orgMissions"], ["feeds", "all-posts"], ["feeds"], ["all-posts"]);
      options?.onSuccess?.(data, variables);
    },
    onError: (err) => {
      const responseData = err.response?.data;
      let msg = responseData?.message;
      if (!msg && responseData?.errors) {
        if (Array.isArray(responseData.errors)) {
          msg = responseData.errors
            .map((e) => (typeof e === "string" ? e : e.msg || e.message || JSON.stringify(e)))
            .join(", ");
        } else if (typeof responseData.errors === "object") {
          msg = Object.entries(responseData.errors)
            .map(([k, v]) => (typeof v === "object" ? v?.message || v?.msg || JSON.stringify(v) : `${k}: ${v}`))
            .join(", ");
        }
      } else if (!msg && responseData?.error) {
        msg = typeof responseData.error === "string" ? responseData.error : JSON.stringify(responseData.error);
      }
      if (!msg && typeof responseData === "string") {
        msg = responseData;
      }
      if (!msg) {
        msg = err.message || i18n.t("missionDetails:toast.updateFailed");
      }
      showError(msg);
      options?.onError?.(err, msg);
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
      showSuccess(data?.message || i18n.t("missionDetails:toast.deleted"));
      queryClient.removeQueries(["mission", id]);
      queryClient.resetQueries({ queryKey: ["orgMissions"] });
      queryClient.resetQueries({ queryKey: ["missions"] });
      queryClient.resetQueries({ queryKey: ["feeds"] });
      syncInvalidateQueries(["orgMissions"], ["missions"], ["feeds", "all-posts"], ["feeds"], ["all-posts"]);

      options?.onSuccess?.(data, id);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || i18n.t("missionDetails:toast.deleteFailed");
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
      syncInvalidateQueries(["mission", id], ["feeds", "all-posts"], ["feeds"], ["all-posts"]);
      showSuccess(data?.message || i18n.t("missionDetails:toast.posted"));
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || i18n.t("missionDetails:toast.postFailed");
      showError(msg);
      options?.onError?.(err);
    },
  });
}

export function useAllMissions({ page, limit }, options = {}) {
  return useQuery({
    queryKey: ["missions", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/mission/list", { params: { page, limit } });
      return data;
    },
    keepPreviousData: true,
    ...options,
  });
}

export function useInfiniteMissions({ limit = 10 }, options = {}) {
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
    ...options,
  });
}

export function useAllOrganizationMissions({ page, limit }, options = {}) {
  return useQuery({
    queryKey: ["orgMissions", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/mission/all", { params: { page, limit } });
      return data;
    },
    keepPreviousData: true,
    ...options,
  });
}

export function useInfiniteOrganizationMissions({ limit = 10 }, options = {}) {
  return useInfiniteQuery({
    queryKey: ["orgMissions", "infinite", limit],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.get("/mission/all", { params: { page: pageParam, limit } });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.totalMissions || lastPage.total || 0;
      const totalPages = lastPage.totalPages || Math.ceil(total / limit);
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    ...options,
  });
}

export function useAllFeeds({ page, limit }, options = {}) {
  return useQuery({
    queryKey: ["feeds", "all-posts", page, limit],
    queryFn: async () => {
      const { data } = await api.get("/mission/all-feeds", { params: { page, limit } });
      return data;
    },
    keepPreviousData: true,
    ...options,
  });
}

export function useInfiniteFeeds({ limit = 10 } = {}, options = {}) {
  return useInfiniteQuery({
    queryKey: ["feeds", "all-posts", "infinite", limit],
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
    ...options,
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
        showSuccess(data?.message || i18n.t("missionDetails:toast.requestSent"));
        syncInvalidateQueries(["notifications"]);
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        showError(err.response?.data?.message || i18n.t("missionDetails:toast.requestFailed"));
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
        showSuccess(data?.message || i18n.t("missionDetails:toast.completionSent"));
        if (missionId) {
          queryClient.invalidateQueries(["mission", String(missionId)]);
          queryClient.invalidateQueries(["mission", Number(missionId)]);
        }
        queryClient.invalidateQueries(["groupVolunteers"]);
        queryClient.invalidateQueries(["notifications"]);
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        showError(err.response?.data?.message || i18n.t("missionDetails:toast.completionFailed"));
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
        showSuccess(data?.message || i18n.t("missionDetails:toast.volunteerAccepted"));
        queryClient.invalidateQueries(["notifications"]);
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        showError(err.response?.data?.message || i18n.t("missionDetails:toast.volunteerAcceptFailed"));
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
        showSuccess(data?.message || i18n.t("missionDetails:toast.volunteerRejected"));
        queryClient.invalidateQueries(["notifications"]);
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        showError(err.response?.data?.message || i18n.t("missionDetails:toast.volunteerRejectFailed"));
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
        showSuccess(data?.message || i18n.t("missionDetails:toast.started"));
        syncInvalidateQueries(["feeds", "all-posts"], ["missions"], ["orgMissions"]);
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        showError(err.response?.data?.message || i18n.t("missionDetails:toast.startFailed"));
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
        showSuccess(data?.message || i18n.t("missionDetails:toast.markedComplete"));
        syncInvalidateQueries(["feeds", "all-posts"], ["missions"], ["orgMissions"]);
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        showError(err.response?.data?.message || i18n.t("missionDetails:toast.markCompleteFailed"));
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
        showSuccess(data?.message || i18n.t("missionDetails:toast.completionRejected"));
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        showError(err.response?.data?.message || i18n.t("missionDetails:toast.completionRejectFailed"));
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
      onSuccess: (data, variables) => {
        const missionId = variables?.missionId;
        if (missionId) {
          queryClient.invalidateQueries({ queryKey: ["mission", String(missionId)] });
          queryClient.invalidateQueries({ queryKey: ["mission", Number(missionId)] });
        }
        syncInvalidateQueries(["feeds", "all-posts"], ["feeds"], ["all-posts"]);
        showSuccess(data?.message || i18n.t("missionDetails:toast.feedLiked"));
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || i18n.t("missionDetails:toast.feedLikeFailed");
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
      onSuccess: (data) => {
        syncInvalidateQueries(["feeds", "all-posts"], ["feeds"], ["all-posts"]);
        showSuccess(data?.message || i18n.t("missionDetails:toast.commentDisabled"));
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || i18n.t("missionDetails:toast.commentDisableFailed");
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
      onSuccess: (data, variables) => {
        const missionId = variables?.missionId;
        if (missionId) {
          queryClient.invalidateQueries({ queryKey: ["mission", String(missionId)] });
          queryClient.invalidateQueries({ queryKey: ["mission", Number(missionId)] });
        }
        syncInvalidateQueries(["feeds", "all-posts"], ["feeds"], ["all-posts"]);
        showSuccess(data?.message || i18n.t("missionDetails:toast.commented"));
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || i18n.t("missionDetails:toast.commentFailed");
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
        queryClient.invalidateQueries({ queryKey: ["mission"] });
        syncInvalidateQueries(["feeds", "all-posts"], ["feeds"], ["all-posts"]);
        showSuccess(data?.message || i18n.t("missionDetails:toast.commentUpdated"));
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || i18n.t("missionDetails:toast.commentUpdateFailed");
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
        showSuccess(data?.message || i18n.t("missionDetails:toast.joinedOrg"));
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        showError(err.response?.data?.message || i18n.t("missionDetails:toast.joinOrgFailed"));
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
      onSuccess: (data, variables) => {
        showSuccess(data?.message || i18n.t("missionDetails:toast.commentDeleted"));
        queryClient.invalidateQueries({ queryKey: ["mission"] });
        syncInvalidateQueries(["feeds", "all-posts"], ["feeds"], ["all-posts"]);

        options?.onSuccess?.(data, variables);
      },
      onError: (err) => {
        const msg = err.response?.data?.message || i18n.t("missionDetails:toast.commentDeleteFailed");
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
        showSuccess(data?.message || i18n.t("missionDetails:toast.orgRequestRejected"));
        options?.onSuccess?.(data);
      },
      onError: (err) => {
        showError(err.response?.data?.message || i18n.t("missionDetails:toast.orgRequestRejectFailed"));
        options?.onError?.(err);
      },
    });
  }