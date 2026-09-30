import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ThemeButton } from "../../components/ThemeButton";
import { InputField } from "../../components/InputField";
import { ImageInput } from "../../components/ImageInput";
import { editVolunteerGroupProfileSchema } from "../../schema/volunteerGroup";
import useUserProfile from "../../hooks/useUserProfile";
import { useVolunteerEditProfile } from "../../api/volunteer";
import MapComponent from "../../components/MapComponent";
import { PhoneInput } from "../../components/PhoneInput";
import { cleanUSPhoneNumber } from "../../utils/phoneUtils";

export default function EditVolunteerGroupForm() {
    const { user, refetch } = useUserProfile();
    const { mutate, isPending } = useVolunteerEditProfile();
    const {
      register,
      handleSubmit,
      control,
      reset,
      setValue,
      watch,
      formState: { errors },
    } = useForm({
      resolver: yupResolver(editVolunteerGroupProfileSchema),
      mode: 'onChange',
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.name || "",
                description: user.description || "",
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
            <h2 className="text-2xl font-semibold text-center text-blue-600">Volunteer Group Profile</h2>
            <div className="flex flex-col items-center gap-2">
                <Controller
                    control={control}
                    name="image"
                    render={({ field }) => (
                        <ImageInput value={field.value} onChange={field.onChange} hideLabel />
                    )}
                />
                <span className="text-sm text-blue-500 cursor-pointer hover:underline" onClick={() => document.querySelector("input[type=file]").click()}>
                    Change Logo / Image
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <InputField label="Volunteer Group Name" {...register("name")} error={errors.name?.message} />
                </div>
                <div className="col-span-2">
                    <PhoneInput
                        control={control}
                        name="contact_no"
                        label="Contact Number"
                        error={errors.contact_no}
                    />
                </div>
            </div>
            
            <div className="">
                <label className="block text-gray-700 text-sm font-medium mb-1">Group Base Location</label>
                <MapComponent
                    defaultLocation={{ lat: parseFloat(user?.lat) || 31.5204, lng: parseFloat(user?.lng) || 74.3587 }}
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
                <label className="block text-gray-700 text-sm font-medium mb-1">Group Description</label>
                <textarea {...register("description")} rows={4} className={`w-full p-3 border bg-white ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400`} placeholder="Tell us about your volunteer group, its cause, etc..." />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
            
            <ThemeButton type="submit" isLoading={isPending}>Save Profile Changes</ThemeButton>
        </form>
    );
}
