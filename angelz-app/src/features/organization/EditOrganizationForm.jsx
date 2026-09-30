import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ThemeButton } from "../../components/ThemeButton";
import { InputField } from "../../components/InputField";
import { ImageInput } from "../../components/ImageInput";
import { editOrganizationProfileSchema } from "../../schema/organization";
import useUserProfile from "../../hooks/useUserProfile";
import { useOrganizationEditProfile } from "../../api/organization";
import { ORGANIZATAION_TYPE_OPTIONS } from "../../constant/ORGANIZATION_TYPE";
import MapComponent from "../../components/MapComponent";
import { PhoneInput } from "../../components/PhoneInput";
import { cleanUSPhoneNumber } from "../../utils/phoneUtils";

export default function EditOrganizationForm() {
    const { user, refetch } = useUserProfile();
    const { mutate, isPending } = useOrganizationEditProfile();
    const {
      register,
      handleSubmit,
      control,
      reset,
      setValue,
      watch, clearErrors,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(editOrganizationProfileSchema),
      mode: 'onChange',
    });

    // Helper to ensure URL starts with a single https:// and removes any leading protocol repetitions (http://, https://, http:, https:)
    const ensureHttps = (url) => {
        if (!url) return '';
        // Trim whitespace
        let trimmed = url.trim();
        // Remove all leading protocol occurrences (e.g., https://https:...)
        trimmed = trimmed.replace(/^(https?:\/\/?)*/i, '');
        // Prepend single https://
        return `https://${trimmed}`;
    };
    const [city, state, country] = watch(["city", "state", "country"]);

    useEffect(() => {
        if (user) {
            reset({
                name: user.name || "",
                last_name: user.last_name || "",
                description: user.description || "",
                company_name: user.company_name || "",
                organization_website: user.organization_website || "",
                services: user.services || "",
                contact_no: user.contact_no || "",
                city: user.city || "",
                state: user.state || "",
                address: user.address || "",
                country: user.country || "",
                image: user.image || "",
                lat: user.lat || "",
                lng: user.lng || "",
            });
        }
    }, [user, reset]);




    const handleLocationSelect = (location) => {
        setValue('lat', location.lat);
        setValue('lng', location.lng);
        setValue('city', location.city);
        setValue('state', location.state);
        setValue('country', location.country);
        setValue('address', location.address);
    };

    const onSubmit = (data) => {
        const cleanedData = {
            ...data,
            organization_website: data.organization_website,
            contact_no: cleanUSPhoneNumber(data.contact_no),
        };
        const formData = new FormData();
        Object.entries(cleanedData).forEach(([key, value]) => {
            if (value instanceof File) formData.append(key, value);
            else if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
            else formData.append(key, value ?? "");
        });
        mutate(formData, { onSuccess: refetch });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="glass-card max-w-2xl mx-auto p-6 sm:p-8 md:p-10 space-y-8 my-8 transition-all duration-300">
            <h2 className="text-2xl font-semibold text-center">Organization Profile</h2>
            <div className="flex flex-col items-center gap-2">
                <Controller
                    control={control}
                    name="image"
                    render={({ field }) => (
                        <ImageInput value={field.value} onChange={field.onChange} hideLabel />
                    )}
                />
                <span className="text-sm text-amber-500 cursor-pointer" onClick={() => document.querySelector("input[type=file]").click()}>
                    Edit
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <InputField label="First Name" {...register("name")} error={errors.name?.message} />
                <InputField label="Last Name" {...register("last_name")} error={errors.last_name?.message} />
                <InputField label="Organization Name" {...register("company_name")} error={errors.company_name?.message} />
                <InputField label="Organization Website" {...register("organization_website")} error={errors.organization_website?.message} />
                {/* <InputField label="Email" {...register("email")} error={errors.email?.message} disabled={true} /> */}
                <PhoneInput
                    control={control}
                    name="contact_no"
                    label="Phone Number"
                    error={errors.contact_no}
                />
            </div>
            <div className="">
                <label className="block text-gray-700 text-sm font-medium mb-1">Location</label>
                <MapComponent
                    defaultLocation={{ lat: parseFloat(user?.lat) || 40.730610, lng: parseFloat(user?.lng) || -73.935242 }}
                    address={user?.address}
                    onLocationSelect={handleLocationSelect}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputField label="City" {...register("city")} disabled={true} error={errors.city?.message} />
                <InputField label="State" {...register("state")} disabled={true} error={errors.state?.message} />
                <InputField label="Country" {...register("country")} disabled={true} error={errors.country?.message} />
                <InputField label="Address" {...register("address")} disabled={true} error={errors.address?.message} />
            </div>
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Organization Type</label>
                <select {...register("services")} className={`w-full p-2 border bg-white ${errors.services ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400`}>
                    <option value="">Select type</option>
                    {ORGANIZATAION_TYPE_OPTIONS.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
                {errors.services && <p className="text-red-500 text-xs mt-1">{errors.services.message}</p>}
            </div>
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Description</label>
                <textarea {...register("description")} rows={3} className={`w-full p-2 border bg-white ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400`} />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <ThemeButton type="submit" isLoading={isPending}>Save Changes</ThemeButton>
        </form>
    );
}