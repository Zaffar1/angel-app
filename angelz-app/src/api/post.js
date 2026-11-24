import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
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
            showSuccess(data?.message || 'Post created successfully!');
            queryClient.invalidateQueries({ queryKey: ['feeds'], refetchType: 'all' });
            queryClient.invalidateQueries({ queryKey: ['all-posts'], refetchType: 'all' });
            queryClient.resetQueries({ queryKey: ['feeds'] });
            syncInvalidateQueries(['feeds', 'all-posts'], ['feeds'], ['all-posts']);
            options?.onSuccess?.(data);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Post creation failed!';
            showError(msg);
            options?.onError?.(err);
        },
    });
}