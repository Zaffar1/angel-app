import * as yup from 'yup';

export const loginSchema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
});

export const registerSchema = yup.object({
    name: yup.string().required('First name is required'),
    last_name: yup.string().required('Last name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            'Password must contain at least one uppercase letter, lowercase letter, special character and number'
        )
        .required('Password is required'), confirmPassword: yup
            .string()
            .oneOf([yup.ref('password')], 'Passwords must match')
            .required('Confirm password is required'),
    type: yup.string().oneOf(['volunteer_group', 'organization']).required('Type is required'),
});

export const forgotPasswordSchema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
});

export const resetPasswordSchema = yup.object({
    password: yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            'Password must contain at least one uppercase letter, lowercase letter, special character and number'
        )
        .required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords must match')
        .required('Confirm password is required'),
});

export const changePasswordSchema = yup.object({
    currentPassword: yup.string().required('Current password is required'),
    password: yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            'Password must contain at least one uppercase letter, lowercase letter, special character and number'
        )
        .required('New password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords must match')
        .required('Confirm password is required'),
});

