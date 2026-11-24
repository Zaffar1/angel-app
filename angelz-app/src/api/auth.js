import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from './client';
import { showSuccess, showError } from '../utils/toast';
import { useDispatch } from 'react-redux';
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
            showSuccess(data?.message || 'Login successful!');
            options?.onSuccess?.(data);
            dispatch(setCredentials(data));

        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Login failed!';
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
            showSuccess(data?.message || "Registration successful!");
            options?.onSuccess?.(data);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || "Registration failed!";
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
            showSuccess(data?.message || "Reset link sent to your email!");
            options?.onSuccess?.(data);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || "Failed to send reset link!";
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
            showSuccess(data?.message || "Password reset successful!");
            options?.onSuccess?.(data);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || "Failed to reset password!";
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
            showSuccess(data?.message || "Password changed successfully!");
            options?.onSuccess?.(data);
        },
        onError: (err) => {
            const msg = err.response?.data?.message || "Failed to change password!";
            showError(msg);
            options?.onError?.(err);
        },
    });
}

