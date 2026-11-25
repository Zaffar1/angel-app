import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from './client';
import { showSuccess, showError } from '../utils/toast';
import { useDispatch } from 'react-redux';
import i18n from '../i18n';
import { clearCredentials, setCredentials } from '../features/auth/authSlice';

export function useLogin(options = {}) {
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post('/users/login', payload);
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            return data;
        },
        onSuccess: (data) => {
            showSuccess(data?.message || i18n.t('auth:toast.loginSuccess'));
            options?.onSuccess?.(data);
            dispatch(setCredentials(data));

        },
        onError: (err) => {
            const msg = err.response?.data?.message || i18n.t('auth:toast.loginFailed');
            showError(msg);
            options?.onError?.(err);
        },
    });
}

export function useRegister(options = {}) {
    const dispatch = useDispatch();

    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post("/users/register", payload);
            return data;
        },
        onSuccess: (data) => {
            if (data?.token) {
                dispatch(setCredentials({ token: data.token, user: data?.user }));
            }
            showSuccess(data?.message || i18n.t('auth:toast.registerSuccess'));
            options?.onSuccess?.(data);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || i18n.t('auth:toast.registerFailed');
            showError(msg);
            options?.onError?.(err);
        },
    });
}

export function useUserProfile(enabled = true, options = {}) {
    const dispatch = useDispatch();
    const query = useQuery({
        queryKey: ["userProfile"],
        queryFn: async () => {
            const { data } = await api.get("/users/user-profile");
            return data?.userDetails || data;
        },
        enabled,
        retry: false,
        staleTime: 5 * 60 * 1000,
        ...options,
    });

    useEffect(() => {
        if (query.data) {
            dispatch(
                setCredentials({
                    token: localStorage.getItem("token"),
                    user: query.data,
                })
            );
        }
    }, [query.data, dispatch]);

    return query;
}

export function useForgotPassword(options = {}) {
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post("/users/forgot-password", payload);
            return data;
        },
        onSuccess: (data) => {
            showSuccess(data?.message || i18n.t('auth:toast.forgotSuccess'));
            options?.onSuccess?.(data);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || i18n.t('auth:toast.forgotFailed');
            showError(msg);
            options?.onError?.(err);
        },
    });
}

export function useResetPassword(options = {}) {
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post("/users/reset-password", payload);
            return data;
        },
        onSuccess: (data) => {
            showSuccess(data?.message || i18n.t('auth:toast.resetSuccess'));
            options?.onSuccess?.(data);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || i18n.t('auth:toast.resetFailed');
            showError(msg);
            options?.onError?.(err);
        },
    });
}

export function useChangePassword(options = {}) {
    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post("/users/change-password", payload);
            return data;
        },
        onSuccess: (data) => {
            showSuccess(data?.message || i18n.t('auth:toast.changeSuccess'));
            options?.onSuccess?.(data);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || i18n.t('auth:toast.changeFailed');
            showError(msg);
            options?.onError?.(err);
        },
    });
}

