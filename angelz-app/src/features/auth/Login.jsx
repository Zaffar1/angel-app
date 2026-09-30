import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "../../schema/auth";
import { useLogin } from "../../api/auth";
import { data, Link } from "react-router-dom";
import { InputField } from "../../components/InputField";
import { ThemeButton } from "../../components/ThemeButton";
import SocialLogin from "../../components/SocialLogin";

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(loginSchema),
    });
    const mutation = useLogin();
    const onSubmit = (formData) => mutation.mutate(formData);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="relative glass-card w-[600px] p-10 flex flex-col justify-center">
                <div className="max-w-md w-full mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-3">Welcome back!</h2>
                    <p className="text-gray-500 text-center mb-10">
                        Welcome again, you have been missed!
                    </p>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <InputField
                            label="Email"
                            placeholder="Email"
                            {...register("email")}
                            error={errors.email?.message}
                        />

                        <InputField
                            label="Password"
                            type="password"
                            placeholder="Password"
                            {...register("password")}
                            error={errors.password?.message}
                        />

                        <div className="flex justify-end mb-4">
                            <Link to={'/forgot-password'} className="text-blue-500 text-sm">
                                Forgot Password?
                            </Link>
                        </div>
                        <ThemeButton
                            type="submit"
                            isLoading={mutation.isPending}>
                            Login
                        </ThemeButton>
                    </form>
                    <p className="text-center mt-6">
                        Don’t have an account?{" "}
                        <Link to="/register" className="text-blue-500">
                            Signup
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

