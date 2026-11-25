import useLocale from "../../hooks/useLocale";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { changePasswordSchema } from "../../schema/auth";
import { useChangePassword } from "../../api/auth";
import { InputField } from "../../components/InputField";
import { ThemeButton } from "../../components/ThemeButton";

export default function ChangePassword() {
    const { t } = useLocale("auth");
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(changePasswordSchema),
    });

    const mutation = useChangePassword({
        onSuccess: () => reset(),
    });

    const onSubmit = (formData) => {
        mutation.mutate(formData);
    };

    return (
        <div className="max-w-md mx-auto py-10 px-6">
            <div className="glass-card p-8 sm:p-10">
                <h2 className="text-2xl font-bold text-center mb-6">{t("changePassword.title")}</h2>
                <p className="text-gray-500 text-center mb-8">
                    {t("changePassword.subtitle")}
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <InputField
                        label={t("changePassword.currentPassword")}
                        type="password"
                        placeholder={t("changePassword.currentPasswordPlaceholder")}
                        dir="ltr"
                        {...register("currentPassword")}
                        error={errors.currentPassword?.message}
                    />

                    <InputField
                        label={t("changePassword.newPassword")}
                        type="password"
                        placeholder={t("changePassword.newPasswordPlaceholder")}
                        dir="ltr"
                        {...register("password")}
                        error={errors.password?.message}
                    />

                    <InputField
                        label={t("changePassword.confirmPassword")}
                        type="password"
                        placeholder={t("changePassword.confirmPasswordPlaceholder")}
                        dir="ltr"
                        {...register("confirmPassword")}
                        error={errors.confirmPassword?.message}
                    />

                    <div className="pt-4">
                        <ThemeButton
                            type="submit"
                            isLoading={mutation.isPending}
                            className="w-full"
                        >
                            {t("changePassword.submit")}
                        </ThemeButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
