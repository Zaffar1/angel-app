import { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ThemeButton } from "../../components/ThemeButton";
import { InputField } from "../../components/InputField";
import { ImageInput } from "../../components/ImageInput";
import { editVolunteerProfileSchema } from "../../schema/volunteer";
import useUserProfile from "../../hooks/useUserProfile";
import { useVolunteerEditProfile } from "../../api/volunteer";
import { RxCross1, RxPlus, RxClock } from "react-icons/rx";
import MapComponent from "../../components/MapComponent";
import { DAYS_OF_WEEK } from "../../constant/DAYS_OF_WEEK";
import { PhoneInput } from "../../components/PhoneInput";
import { cleanUSPhoneNumber } from "../../utils/phoneUtils";

export default function EditVolunteerForm() {
  const { user, refetch } = useUserProfile();
  const { mutate, isPending } = useVolunteerEditProfile();

  const form = useForm({
    resolver: yupResolver(editVolunteerProfileSchema),
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = form;
  const { fields: prefFields, append: appendPref, remove: removePref } = useFieldArray({ control, name: "preferences" });
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: "expertise" });
  const { fields: timeFields, append: appendTime, remove: removeTime } = useFieldArray({ control, name: "available_timing" });

  const [city, state, country] = watch(["city", "state", "country"]);

  useEffect(() => {
    if (user) {
      reset({
        name: user?.name || "",
        last_name: user?.last_name || "",
        contact_no: user?.contact_no || "",
        address: user?.address || "",
        city: user?.city || "",
        state: user?.state || "",
        country: user?.country || "",
        image: user?.image || "",
        preferences: user?.preferences || [],
        expertise: user?.expertise || [],
        available_timing: user?.available_timing || [],
        lat: user?.lat || "",
        lng: user?.lng || "",
      });
    }
  }, [user, reset]);

  const handleLocationSelect = (location) => {
    Object.entries({
      lat: location.lat,
      lng: location.lng,
      city: location.city,
      state: location.state,
      country: location.country,
      address: location.address,
    }).forEach(([key, value]) => setValue(key, value));
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

  const ArrayField = ({ fields, append, remove, name, placeholder }) => (
    <div className="space-y-3">
      <label className="text-gray-700 text-sm font-medium">{name}</label>
      <div className="flex flex-wrap gap-2">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
            <input {...register(`${name.toLowerCase()}.${idx}`)} placeholder={placeholder} className="bg-transparent outline-none text-sm w-32" />
            <button type="button" onClick={() => remove(idx)} className="text-red-500 hover:text-red-700 transition-colors">
              <RxCross1 size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => append("")} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
          <RxPlus size={16} /> Add {name.slice(0, -1)}
        </button>
      </div>
    </div>
  );

  const TimingSlot = ({ index, remove, error }) => {
    const currentDay = watch(`available_timing.${index}.day`);
    const dayError = error?.day;
    const startError = error?.start_time;
    const endError = error?.end_time;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
            Time Slot #{index + 1}
            {currentDay && <span className="ml-2 text-blue-600 normal-case">• {currentDay}</span>}
          </span>
          <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50">
            <RxCross1 size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-6">
            <label className="block text-gray-600 text-xs font-semibold mb-2 uppercase tracking-wide">Day</label>
            <Controller
              control={control}
              name={`available_timing.${index}.day`}
              render={({ field }) => (
                <>
                  <select {...field} className={`w-full p-3 border ${dayError ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}>
                    <option value="">Select day</option>
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  {dayError && <p className="text-red-500 text-xs mt-1">{dayError.message}</p>}
                </>
              )}
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-gray-600 text-xs font-semibold mb-2 uppercase tracking-wide">From</label>
            <Controller
              control={control}
              name={`available_timing.${index}.start_time`}
              render={({ field }) => (
                <>
                  <input
                    type="time"
                    {...field}
                    className={`w-full p-3 border ${startError ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
                  />
                  {startError && <p className="text-red-500 text-xs mt-1">{startError.message}</p>}
                </>
              )}
            />
          </div>

          <div className="lg:col-span-3">
            <label className="block text-gray-600 text-xs font-semibold mb-2 uppercase tracking-wide">To</label>
            <Controller
              control={control}
              name={`available_timing.${index}.end_time`}
              render={({ field }) => (
                <>
                  <input
                    type="time"
                    {...field}
                    className={`w-full p-3 border ${endError ? 'border-red-500' : 'border-gray-300'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white`}
                  />
                  {endError && <p className="text-red-500 text-xs mt-1">{endError.message}</p>}
                </>
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const TimingField = () => {
    const timingError = errors?.available_timing?.root?.message || errors?.available_timing?.message;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-sm font-medium">Available Timings</span>
          </div>
          <button type="button" onClick={() => appendTime({ day: "", start_time: "09:00", end_time: "17:00" })} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors ml-auto">
            <RxPlus size={16} /> Add Time Slot
          </button>
        </div>

        <div className="space-y-3">
          {timeFields.map((field, index) => {
            const fieldError = errors?.available_timing?.[index];
            return <TimingSlot key={field.id} field={field} index={index} remove={removeTime} error={fieldError} />;
          })}
        </div>

        {timeFields.length === 0 && (
          <div className={`text-center py-8 border-2 border-dashed ${timingError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'} rounded-xl transition-colors`}>
            <RxClock className={`w-12 h-12 mx-auto mb-3 ${timingError ? 'text-red-400' : 'text-gray-400'}`} />
            <p className={`text-sm font-medium ${timingError ? 'text-red-500' : 'text-gray-500'}`}>
              {timingError || 'No time slots added yet'}
            </p>
            {timingError && (
              <p className="text-xs text-red-400 mt-1">Click "Add Time Slot" above to add one.</p>
            )}
          </div>
        )}

        {timingError && timeFields.length > 0 && (
          <p className="text-red-500 text-sm">{timingError}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card max-w-2xl mx-auto p-6 sm:p-8 md:p-10 space-y-8 my-8 transition-all duration-300">
      <h2 className="text-2xl font-semibold text-center">Volunteer Profile</h2>
      <div className="flex flex-col items-center gap-2">
        <Controller
          control={control}
          name="image"
          render={({ field }) => <ImageInput value={field.value} onChange={field.onChange} hideLabel />}
        />
        <span className="text-sm text-amber-500 cursor-pointer hover:text-amber-600 transition-colors" onClick={() => document.querySelector("input[type=file]")?.click()}>
          Edit
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="First Name" {...register("name")} error={errors.name?.message} />
        <InputField label="Last Name" {...register("last_name")} error={errors.last_name?.message} />
      </div>
      <div className="grid grid-cols-1 gap-4">
        <PhoneInput
          control={control}
          name="contact_no"
          label="Phone Number"
          error={errors.contact_no}
        />
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Location</h3>
        <MapComponent
          defaultLocation={{ lat: parseFloat(user?.lat) || 40.730610, lng: parseFloat(user?.lng) || -73.935242 }}
          address={user?.address}
          onLocationSelect={handleLocationSelect}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="City" {...register("city")} disabled className="bg-gray-50" error={errors.city?.message} />
        <InputField label="State" {...register("state")} disabled className="bg-gray-50" error={errors.state?.message} />
        <InputField label="Country" {...register("country")} disabled className="bg-gray-50" error={errors.country?.message} />
        <InputField label="Address" {...register("address")} disabled className="bg-gray-50" error={errors.address?.message} />
      </div>
      <ArrayField fields={prefFields} append={appendPref} remove={removePref} name="Preferences" placeholder="Add preference" />
      <ArrayField fields={expFields} append={appendExp} remove={removeExp} name="Expertise" placeholder="Add expertise" />
      <TimingField />
      <ThemeButton type="submit" isLoading={isPending}>Save Changes</ThemeButton>
    </form>
  );
}