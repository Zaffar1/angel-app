import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registerSchema } from "../../schema/auth";
import { useRegister } from "../../api/auth";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import { Link } from "react-router-dom";
import { InputField } from "../../components/InputField";
import { ThemeButton } from "../../components/ThemeButton";
import SocialLogin from "../../components/SocialLogin";

export default function Register() {
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
  });

  const mutation = useRegister({
    onSuccess: (data) => {
      dispatch(setCredentials(data));
    },
  });

  const onSubmit = (formData) => mutation.mutate(formData);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="relative glass-card w-[600px] p-10 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Create Account</h2>
          <p className="text-gray-500 text-center mb-10">
            Join us and become a part of our community.
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>

            <div className="flex gap-4">
              <div className="flex-1">
                <InputField
                  label="First Name"
                  placeholder="Enter your first name"
                  {...register("name")}
                  error={errors.name?.message}
                />
              </div>
              <div className="flex-1">
                <InputField
                  label="Last Name"
                  placeholder="Enter your last name"
                  {...register("last_name")}
                  error={errors.last_name?.message}
                />
              </div>
            </div>

            <InputField
              label="Email"
              placeholder="Enter your email"
              {...register("email")}
              error={errors.email?.message}
            />

            <div className="flex gap-4">
              <div className="flex-1">
                <InputField
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                  error={errors.password?.message}
                />
              </div>
              <div className="flex-1">
                <InputField
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter your password"
                  {...register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-1">Select Type</label>
              <select
                {...register("type")}
                className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select type</option>
                <option value="volunteer_group">Volunteer Group</option>
                <option value="organization">Organization</option>
              </select>
              {errors.type?.message && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            <ThemeButton type="submit" isLoading={mutation.isPending}>
              Register
            </ThemeButton>
          </form>

          <p className="text-center mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500">
              Login
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
