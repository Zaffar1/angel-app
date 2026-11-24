import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { createMissionSchema } from "../../schema/mission";
import { ThemeButton } from "../../components/ThemeButton";
import { InputField } from "../../components/InputField";
import { ImageInput } from "../../components/ImageInput";
import { useCreateMission } from "../../api/mission";
import { useNavigate } from "react-router-dom";
import MapComponent from "../../components/MapComponent";
import { DateTimePicker } from "../../components/DateTimePicker";
import { toLocalISOString, getTodayLocalDateString } from "../../utils/dateUtils";

import {
  FaHeart, FaRegHeart, FaPaperPlane, FaComment, FaRegComment
} from "react-icons/fa";
import { IoPaperPlaneSharp } from "react-icons/io5";

export default function AddMissionForm() {
  const { mutate, isPending } = useCreateMission();
  const navigate = useNavigate();
  const defaultLocation = { lat: 40.73061, lng: -73.935242 };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(createMissionSchema),
    defaultValues: {
      status: "pending",
      allow_interaction: { comments: false, likes: false, share: false },
      images: [],
      lat: defaultLocation.lat,
      lng: defaultLocation.lng,
    },
  });

  const startTime = watch("start_time");
  const allowInteraction = watch("allow_interaction");

  const onSubmit = (data) => {
    const formData = new FormData();
    ["start_time", "end_time"].forEach((key) => {
      if (data[key]) {
        data[key] = toLocalISOString(data[key]);
      }
    });
    if (!Array.isArray(data.images)) data.images = [];
    Object.entries(data).forEach(([key, value]) => {
      if (value == null) return;
      if (value instanceof File || (Array.isArray(value) && value.every(item => item instanceof File))) {
        (Array.isArray(value) ? value : [value]).forEach((item) =>
          formData.append(key + (Array.isArray(value) ? "[]" : ""), item)
        );
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    mutate(formData, {
      onSuccess: () => navigate("/organization/mission/by-organization"),
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass-card max-w-3xl mx-auto p-6 sm:p-8 md:p-10 space-y-8 my-8 transition-all duration-300"
    >
      <h2 className="text-2xl font-semibold text-center">Create New Mission</h2>
      <div className="flex flex-col items-center w-full">
        <Controller
          control={control}
          name="file"
          render={({ field }) => (
            <ImageInput
              value={field.value}
              onChange={field.onChange}
              error={errors.file?.message}
              size="full"
              hideLabel
            />
          )}
        />
        <div
          className="flex items-center gap-2 text-[#4C95FF] font-medium mt-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => document.querySelector("input[type=file]").click()}
        >
          <div className="bg-[#4C95FF]/10 p-2 rounded-lg">
            <IoPaperPlaneSharp className="rotate-45" />
          </div>
          <span className="text-sm">Select image</span>
        </div>
        {errors.file && (
          <p className="text-xs text-red-500 mt-2">{errors.file.message}</p>
        )}
      </div>

      <div className="space-y-6">
        <InputField
          label="Mission Name"
          {...register("name")}
          error={errors.name?.message}
        />

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Description</label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            placeholder="Write about Mission....."
          />
          {errors.description && (
            <p className="text-sm mt-1 text-red-500">{errors.description.message}</p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Location
        </label>
        <MapComponent
          mode="interactive"
          onLocationSelect={({ lat, lng }) => {
            setValue("lat", lat);
            setValue("lng", lng);
          }}
        />
        <p className="text-sm text-gray-500 mt-1">
          Click on the map to set mission coordinates.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="start_time"
          control={control}
          defaultValue={null}
          render={({ field }) => (
            <DateTimePicker
              label="Start Date & Time"
              value={field.value}
              onChange={field.onChange}
              error={errors.start_time?.message}
              minDate={getTodayLocalDateString()}
              required
            />
          )}
        />
        <Controller
          name="end_time"
          control={control}
          defaultValue={null}
          render={({ field }) => (
            <DateTimePicker
              label="End Date & Time"
              value={field.value}
              onChange={field.onChange}
              error={errors.end_time?.message}
              minDate={startTime ? startTime.split("T")[0] : getTodayLocalDateString()}
              required
            />
          )}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Relevant Distance</label>
          <select
            {...register("relevant_distance")}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="">Select Distance</option>
            <option value="local">Local</option>
            <option value="city wide">City Wide</option>
            <option value="country wide">Country Wide</option>
            <option value="global">Global</option>
          </select>
          {errors.relevant_distance && (
            <p className="text-sm mt-1 text-red-500">{errors.relevant_distance.message}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-1">Work type</label>
          <select
            {...register("work_type")}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="">Select Work type</option>
            <option value="tutor">Tutor</option>
            <option value="staff">Staff</option>
            <option value="cleaning">Cleaning</option>
            <option value="watchman">Watchman</option>
          </select>
          {errors.work_type && (
            <p className="text-sm mt-1 text-red-500">{errors.work_type.message}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Points"
          type="number"
          min="0"
          step="1"
          {...register("points")}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            const paste = e.clipboardData?.getData("text") || "";
            if (paste.includes("-") || isNaN(Number(paste)) || Number(paste) < 0) {
              e.preventDefault();
            }
          }}
          onInput={(e) => {
            if (e.target.value !== "" && Number(e.target.value) < 0) {
              e.target.value = "0";
            }
          }}
          error={errors.points?.message}
          placeholder="Enter points"
        />
        <InputField
          label="Volunteers Required"
          type="number"
          min="1"
          step="1"
          {...register("volunteer_required")}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
              e.preventDefault();
            }
          }}
          onPaste={(e) => {
            const paste = e.clipboardData?.getData("text") || "";
            if (paste.includes("-") || isNaN(Number(paste)) || Number(paste) < 0) {
              e.preventDefault();
            }
          }}
          onInput={(e) => {
            if (e.target.value !== "" && Number(e.target.value) < 0) {
              e.target.value = "0";
            }
          }}
          error={errors.volunteer_required?.message}
          placeholder="Enter number"
        />
      </div>

      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">Mission type</label>
        <select
          {...register("mission_type")}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">Select Mission type</option>
          <option value="virtual">Virtual</option>
          <option value="on-site">On-site</option>
        </select>
        {errors.mission_type && (
          <p className="text-sm mt-1 text-red-500">{errors.mission_type.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-gray-700 text-sm font-medium mb-1">Allow Interaction</label>
        <div className="flex flex-wrap gap-10 items-center px-1 py-1">
          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <input
              type="checkbox"
              {...register("allow_interaction.likes")}
              className="hidden"
            />
            <div className={`p-2.5 rounded-full transition-all duration-300 ${allowInteraction?.likes ? "bg-red-50 text-red-500 shadow-sm" : "text-gray-400 hover:bg-gray-50"}`}>
              {allowInteraction?.likes ? <FaHeart size={26} /> : <FaRegHeart size={26} />}
            </div>
            <span className={`text-sm font-bold transition-colors ${allowInteraction?.likes ? "text-red-500" : "text-gray-500"}`}>
              {allowInteraction?.likes ? "Liked" : "Like"}
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <input
              type="checkbox"
              {...register("allow_interaction.share")}
              className="hidden"
            />
            <div className={`p-2.5 rounded-full transition-all duration-300 ${allowInteraction?.share ? "bg-purple-50 text-purple-500 shadow-sm" : "text-gray-400 hover:bg-gray-50"}`}>
              <FaPaperPlane size={22} className={allowInteraction?.share ? "rotate-12" : ""} />
            </div>
            <span className={`text-sm font-bold transition-colors ${allowInteraction?.share ? "text-purple-500" : "text-gray-500"}`}>
              Share
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group select-none">
            <input
              type="checkbox"
              {...register("allow_interaction.comments")}
              className="hidden"
            />
            <div className={`p-2.5 rounded-full transition-all duration-300 ${allowInteraction?.comments ? "bg-blue-50 text-[#4C95FF] shadow-sm" : "text-gray-400 hover:bg-gray-50"}`}>
              {allowInteraction?.comments ? <FaComment size={24} /> : <FaRegComment size={24} />}
            </div>
            <span className={`text-sm font-bold transition-colors ${allowInteraction?.comments ? "text-[#4C95FF]" : "text-gray-500"}`}>
              Comment
            </span>
          </label>
        </div>
      </div>

      <ThemeButton type="submit" isLoading={isPending} className="w-full mt-4">Create Mission</ThemeButton>
    </form>
  );
}