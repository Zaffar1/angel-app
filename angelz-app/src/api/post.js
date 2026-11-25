import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import i18n from '../i18n';
import { showSuccess, showError } from '../utils/toast';
import { syncInvalidateQueries } from '../utils/querySync';

export function usePostMutation(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post('/user-posts', payload);
            return data;
        },
        onSuccess: (data) => {
            showSuccess(data?.message || i18n.t("feed:toast.postCreated"));
            queryClient.invalidateQueries({ queryKey: ['feeds'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['all-posts'], refetchType: 'all' });
            queryClient.resetQueries({ queryKey: ['feeds'] });
            syncInvalidateQueries(['feeds', 'all-posts'], ['feeds'], ['all-posts']);
            options?.onSuccess?.(data);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || i18n.t("feed:toast.postFailed");
            showError(msg);
            options?.onError?.(err);
        },
    });
}