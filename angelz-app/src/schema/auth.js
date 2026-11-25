import * as yup from 'yup';
import i18n from '../i18n';

const tv = (key) => () => i18n.t(`auth:validation.${key}`);

export const loginSchema = yup.object({
    email: yup.string().email(tv('invalidEmail')).required(tv('emailRequired')),
    password: yup.string().required(tv('passwordRequired')),
});

export const registerSchema = yup.object({
    name: yup.string().required(tv('firstNameRequired')),
    last_name: yup.string().required(tv('lastNameRequired')),
    email: yup.string().email(tv('invalidEmail')).required(tv('emailRequired')),
    password: yup.string()
        .min(8, tv('passwordMin'))
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            tv('passwordComplexity')
        )
        .required(tv('passwordRequired')), confirmPassword: yup
            .string()
            .oneOf([yup.ref('password')], tv('passwordsMustMatch'))
            .required(tv('confirmPasswordRequired')),
    type: yup.string().oneOf(['volunteer_group', 'organization']).required(tv('typeRequired')),
});

export const forgotPasswordSchema = yup.object({
    email: yup.string().email(tv('invalidEmail')).required(tv('emailRequired')),
});

export const resetPasswordSchema = yup.object({
    password: yup.string()
        .min(8, tv('passwordMin'))
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            tv('passwordComplexity')
        )
        .required(tv('passwordRequired')),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], tv('passwordsMustMatch'))
        .required(tv('confirmPasswordRequired')),
});

export const changePasswordSchema = yup.object({
    currentPassword: yup.string().required(tv('currentPasswordRequired')),
    password: yup.string()
        .min(8, tv('passwordMin'))
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
            tv('passwordComplexity')
        )
        .required(tv('newPasswordRequired')),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], tv('passwordsMustMatch'))
        .required(tv('confirmPasswordRequired')),
});

