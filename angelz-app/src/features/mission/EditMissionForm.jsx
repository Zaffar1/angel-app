import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ThemeButton } from "../../components/ThemeButton";
import { InputField } from "../../components/InputField";
import { ImageInput } from "../../components/ImageInput";
import MapComponent from "../../components/MapComponent";
import { DateTimePicker } from "../../components/DateTimePicker";
import { editMissionSchema } from "../../schema/mission";
import { useUpdateMission, useMissionDetail } from "../../api/mission";
import { formatForDateTimePicker, toLocalISOString } from "../../utils/dateUtils";
import { safeParseJson } from "../../utils/safeParseJson";
import { showError } from "../../utils/toast";
import { getNonEditableMissionMessage, getNonEditableMissionReason } from "../../utils/missionStatusUtils";
import Loader from "../../components/Loader";
import {
    FaHeart, FaRegHeart, FaPaperPlane, FaComment, FaRegComment
} from "react-icons/fa";
import { IoPaperPlaneSharp } from "react-icons/io5";

export default function EditMissionForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, isError, error } = useMissionDetail(id);
    const mission = data?.data;
    const { mutate, isPending } = useUpdateMission();
    const isOpen = String(mission?.status || "").toLowerCase() === "open";
    const [serverError, setServerError] = useState(null);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(editMissionSchema),
        defaultValues: {
            status: "open",
            allow_interaction: { comments: false, likes: false, share: false },
            images: [],
            lat: 40.73061,
            lng: -73.935242,
        },
    });

    const startTime = watch("start_time");
    const allowInteraction = watch("allow_interaction");

    useEffect(() => {
        if (mission) {
            const parsedInteraction = safeParseJson(mission.allow_interaction, {
                comments: false,
                likes: false,
                share: false,
            });

            reset({
                name: mission.name || "",
                description: mission.description || "",
                relevant_distance: mission.relevant_distance || "",
                work_type: mission.work_type || "",
                mission_type: mission.mission_type || "",
                points: mission.points != null ? mission.points : "",
                volunteer_required: mission.volunteer_required != null ? mission.volunteer_required : "",
                start_time: formatForDateTimePicker(mission?.start_time),
                end_time: formatForDateTimePicker(mission?.end_time),
                allow_interaction: parsedInteraction,
                lat: !isNaN(parseFloat(mission?.lat)) ? parseFloat(mission.lat) : 40.73061,
                lng: !isNaN(parseFloat(mission?.lng)) ? parseFloat(mission.lng) : -73.935242,
                file: mission.file || null,
                status: mission.status || "open",
            });
        }
    }, [mission, reset]);

    useEffect(() => {
        if (mission) {
            const timer = setTimeout(() => {
                setValue("start_time", formatForDateTimePicker(mission?.start_time));
                setValue("end_time", formatForDateTimePicker(mission?.end_time));
            }, 50);

            return () => clearTimeout(timer);
        }
    }, [mission, setValue]);

    const onFormError = (formErrors) => {
        const errorKeys = Object.keys(formErrors);
        if (errorKeys.length > 0) {
            const firstErrorMsg = formErrors[errorKeys[0]]?.message || "Please fix validation errors.";
            showError(firstErrorMsg);
        }
    };

    const onSubmit = (data) => {
        setServerError(null);

        if (!isOpen) {
            showError(getNonEditableMissionMessage(mission?.status));
            return;
        }

        const formData = new FormData();

        ["start_time", "end_time"].forEach((key) => {
            if (data[key]) {
                data[key] = toLocalISOString(data[key]);
            }
        });

        if (!Array.isArray(data.images)) data.images = [];
        if (!data.status) data.status = mission?.status || "open";

        Object.entries(data).forEach(([key, value]) => {
            if (value == null) return;

            // If the key is 'file' and it's a string (existing URL), don't send it back
            if (key === 'file' && typeof value === 'string') return;

            if (value instanceof File || (Array.isArray(value) && value.every((i) => i instanceof File))) {
                (Array.isArray(value) ? value : [value]).forEach((item) =>
                    formData.append(key + (Array.isArray(value) ? "[]" : ""), item)
                );
            } else if (typeof value === "object") {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        });

        mutate(
            { id, payload: formData },
            {
                onSuccess: () => navigate(`/organization/mission/${id}`),
                onError: (err, errMsg) => {
                    const message = errMsg || err.response?.data?.message || err.message || "Failed to update mission.";
                    setServerError(message);
                },
            }
        );
    };

    if (isLoading) return <Loader />;

    if (isError || (!isLoading && !mission)) {
        return (
            <div className="glass-card max-w-xl mx-auto p-8 my-12 text-center space-y-4">
                <div className="text-red-500 text-5xl">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800">Error Loading Mission</h2>
                <p className="text-sm text-gray-600">
                    {error?.response?.data?.message || error?.message || "Could not retrieve mission details. Please verify your connection and try again."}
                </p>
                <div className="pt-4 flex justify-center gap-3">
                    <ThemeButton onClick={() => navigate(-1)}>Go Back</ThemeButton>
                    <ThemeButton onClick={() => window.location.reload()} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Retry</ThemeButton>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit, onFormError)}
            className="glass-card max-w-3xl mx-auto p-6 sm:p-8 md:p-10 space-y-8 my-8 transition-all duration-300"
        >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b pb-4">
                <h2 className="text-2xl font-semibold text-center sm:text-left">Edit Mission</h2>
                {mission?.status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${isOpen
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}>
                        Status: {mission.status}
                    </span>
                )}
            </div>

            {!isOpen && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-sm flex items-start gap-3">
                    <span className="text-xl leading-none">⚠️</span>
                    <div>
                        <p className="font-semibold text-base">{getNonEditableMissionReason(mission?.status)}</p>
                        <p className="mt-1 text-amber-700">
                            {getNonEditableMissionMessage(mission?.status)}
                        </p>
                    </div>
                </div>
            )}

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
                    defaultLocation={{
                        lat: !isNaN(parseFloat(mission?.lat)) ? parseFloat(mission.lat) : 40.73061,
                        lng: !isNaN(parseFloat(mission?.lng)) ? parseFloat(mission.lng) : -73.935242,
                    }}
                    onLocationSelect={({ lat, lng }) => {
                        setValue("lat", lat, { shouldValidate: true });
                        setValue("lng", lng, { shouldValidate: true });
                    }}
                />
                {(errors.lat || errors.lng) && (
                    <p className="text-sm mt-1 text-red-500">
                        {errors.lat?.message || errors.lng?.message}
                    </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                    Click on the map to update mission coordinates.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                    name="start_time"
                    control={control}
                    render={({ field }) => (
                        <DateTimePicker
                            label="Start Date & Time"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.start_time?.message}
                            required
                        />
                    )}
                />
                <Controller
                    name="end_time"
                    control={control}
                    render={({ field }) => (
                        <DateTimePicker
                            label="End Date & Time"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.end_time?.message}
                            minDate={startTime ? (startTime.includes('T') ? startTime.split('T')[0] : startTime) : undefined}
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
                        <option value="">Select work type</option>
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

            <div className="pt-4 space-y-3">
                {serverError && (
                    <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-700 text-sm flex items-start gap-3">
                        <span className="text-xl leading-none">❌</span>
                        <div className="flex-1">
                            <p className="font-semibold text-base">Error Updating Mission</p>
                            <p className="mt-1 text-sm text-red-600">{serverError}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setServerError(null)}
                            className="text-red-400 hover:text-red-700 font-bold p-1 leading-none text-base"
                            title="Dismiss error"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <ThemeButton
                    type="submit"
                    isLoading={isPending}
                    disabled={!isOpen || isPending}
                    className={`w-full ${!isOpen ? "opacity-60 cursor-not-allowed" : ""}`}
                    title={!isOpen ? getNonEditableMissionMessage(mission?.status) : "Update Mission"}
                >
                    {isOpen ? "Update Mission" : `Cannot Update (${getNonEditableMissionReason(mission?.status)})`}
                </ThemeButton>
                {Object.keys(errors).length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                        <p className="text-red-600 text-sm font-medium">
                            {Object.values(errors).map((e) => e.message).filter(Boolean).join(" • ") || "Validation error: please check all required fields."}
                        </p>
                    </div>
                )}
            </div>
        </form>
    );
}