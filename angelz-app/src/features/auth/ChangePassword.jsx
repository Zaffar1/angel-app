import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { changePasswordSchema } from "../../schema/auth";
import { useChangePassword } from "../../api/auth";
import { InputField } from "../../components/InputField";
import { ThemeButton } from "../../components/ThemeButton";

export default function ChangePassword() {
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
                <h2 className="text-2xl font-bold text-center mb-6">Change Password</h2>
                <p className="text-gray-500 text-center mb-8">
                    Update your account password to stay secure.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <InputField
                        label="Current Password"
                        type="password"
                        placeholder="Enter current password"
                        {...register("currentPassword")}
                        error={errors.currentPassword?.message}
                    />

                    <InputField
                        label="New Password"
                        type="password"
                        placeholder="Enter new password"
                        {...register("password")}
                        error={errors.password?.message}
                    />

                    <InputField
                        label="Confirm New Password"
                        type="password"
                        placeholder="Confirm new password"
                        {...register("confirmPassword")}
                        error={errors.confirmPassword?.message}
                    />

                    <div className="pt-4">
                        <ThemeButton
                            type="submit"
                            isLoading={mutation.isPending}
                            className="w-full"
                        >
                            Update Password
                        </ThemeButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
