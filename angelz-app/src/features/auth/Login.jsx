import useLocale from "../../hooks/useLocale";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "../../schema/auth";
import { useLogin } from "../../api/auth";
import { Link } from "react-router-dom";
import { InputField } from "../../components/InputField";
import { ThemeButton } from "../../components/ThemeButton";
import SocialLogin from "../../components/SocialLogin";

export default function Login() {
    const { t } = useLocale("auth");
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(loginSchema),
    });
    const mutation = useLogin();
    const onSubmit = (formData) => mutation.mutate(formData);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="relative glass-card w-full max-w-[600px] p-10 flex flex-col justify-center">
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-3">{t("login.title")}</h2>
                    <p className="text-gray-500 text-center mb-10">
                        {t("login.subtitle")}
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <InputField
                            label={t("login.email")}
                            placeholder={t("login.email")}
                            dir="ltr"
                            {...register("email")}
                            error={errors.email?.message}
                        />

                        <InputField
                            label={t("login.password")}
                            type="password"
                            placeholder={t("login.password")}
                            dir="ltr"
                            {...register("password")}
                            error={errors.password?.message}
                        />

                        <div className="flex justify-end mb-4">
                            <Link to={'/forgot-password'} className="text-blue-500 text-sm">
                                {t("login.forgotPassword")}
                            </Link>
                        </div>
                        <ThemeButton
                            type="submit"
                            isLoading={mutation.isPending}>
                            {t("login.submit")}
                        </ThemeButton>
                    </form>
                    <p className="text-center mt-6">
                        {t("login.noAccount")}{" "}
                        <Link to="/register" className="text-blue-500">
                            {t("login.signup")}
                        </Link>
                    </p>

                    <div className="mt-8">
                        <SocialLogin />
                    </div>
                </div>
            </div>
        </div>
    );
}

