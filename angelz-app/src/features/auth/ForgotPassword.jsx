import useLocale from "../../hooks/useLocale";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { forgotPasswordSchema } from "../../schema/auth";
import { useForgotPassword } from "../../api/auth";
import { Link } from "react-router-dom";
import { InputField } from "../../components/InputField";
import { ThemeButton } from "../../components/ThemeButton";

export default function ForgotPassword() {
    const { t } = useLocale("auth");
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(forgotPasswordSchema),
    });

    const mutation = useForgotPassword({
        onSuccess: () => {
            reset();
        }
    });

    const onSubmit = (formData) => mutation.mutate(formData);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="relative glass-card w-full max-w-[600px] p-10 flex flex-col justify-center">
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-3">{t("forgotPassword.title")}</h2>
                    <p className="text-gray-500 text-center mb-10">
                        {t("forgotPassword.subtitle")}
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <InputField
                            label={t("forgotPassword.email")}
                            placeholder={t("forgotPassword.emailPlaceholder")}
                            dir="ltr"
                            {...register("email")}
                            error={errors.email?.message}
                        />

                        <div className="mt-6">
                            <ThemeButton
                                type="submit"
                                isLoading={mutation.isPending}
                            >
                                {t("forgotPassword.submit")}
                            </ThemeButton>
                        </div>
                    </form>

                    <p className="text-center mt-6">
                        {t("forgotPassword.remember")}{" "}
                        <Link to="/login" className="text-blue-500">
                            {t("forgotPassword.backToLogin")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
