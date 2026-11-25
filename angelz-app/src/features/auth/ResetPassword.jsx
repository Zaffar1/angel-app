import useLocale from "../../hooks/useLocale";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { resetPasswordSchema } from "../../schema/auth";
import { useResetPassword } from "../../api/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InputField } from "../../components/InputField";
import { ThemeButton } from "../../components/ThemeButton";

export default function ResetPassword() {
    const { t } = useLocale("auth");
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(resetPasswordSchema),
    });

    const mutation = useResetPassword({
        onSuccess: () => navigate("/login"),
    });

    const onSubmit = (formData) => {
        if (!token || !email) {
            alert(t("resetPassword.invalidLink"));
            return;
        }
        mutation.mutate({ ...formData, token, email });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="relative glass-card w-full max-w-[600px] p-10 flex flex-col justify-center">
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-3">{t("resetPassword.title")}</h2>
                    <p className="text-gray-500 text-center mb-10">
                        {t("resetPassword.subtitle")}
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <InputField
                            label={t("resetPassword.newPassword")}
                            type="password"
                            placeholder={t("resetPassword.newPasswordPlaceholder")}
                            dir="ltr"
                            {...register("password")}
                            error={errors.password?.message}
                        />

                        <InputField
                            label={t("resetPassword.confirmPassword")}
                            type="password"
                            placeholder={t("resetPassword.confirmPasswordPlaceholder")}
                            dir="ltr"
                            {...register("confirmPassword")}
                            error={errors.confirmPassword?.message}
                        />

                        <div className="mt-6">
                            <ThemeButton
                                type="submit"
                                isLoading={mutation.isPending}
                            >
                                {t("resetPassword.submit")}
                            </ThemeButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
