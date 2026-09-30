import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ThemeButton } from "../../components/ThemeButton";
import { InputField } from "../../components/InputField";
import { ImageInput } from "../../components/ImageInput";
import { TagInput } from "../../components/TagInput";
import { useNavigate } from "react-router-dom";
import { IoPaperPlaneSharp } from "react-icons/io5";
import { usePostMutation } from "../../api/post";
import useUserProfile from "../../hooks/useUserProfile";
import {
    FaHeart, FaRegHeart, FaPaperPlane, FaComment, FaRegComment
} from "react-icons/fa";

const createPostSchema = yup.object().shape({
    title: yup.string().required("Title is required"),
    image: yup.mixed().required("Image is required"),
    tags: yup.array().of(yup.string()).optional(),
    allow_interaction: yup.object().shape({
        comments: yup.boolean(),
        likes: yup.boolean(),
        share: yup.boolean(),
    }),
});

export const CreatePost = () => {
    const { mutate, isPending } = usePostMutation();
    const navigate = useNavigate();
    const { user } = useUserProfile();

    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(createPostSchema),
        defaultValues: {
            tags: [],
            allow_interaction: { comments: false, likes: false, share: false },
        }
    });

    const allowInteraction = watch("allow_interaction");

    const onSubmit = (data) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (key === "tags" && Array.isArray(value)) {
                formData.append(key, JSON.stringify(value));
            } else if (key === "allow_interaction") {
                formData.append(key, JSON.stringify(value));
            } else if (value instanceof File) {
                formData.append(key, value);
            } else {
                formData.append(key, value);
            }
        });
        mutate(formData, {
            onSuccess: () => navigate(`/${user?.type ?? "organization"}/feed/all`),
        });
    };
    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="glass-card max-w-3xl mx-auto p-6 sm:p-8 md:p-10 space-y-8 my-8 transition-all duration-300"
        >
            <h2 className="text-2xl font-semibold text-center text-gray-800">Create New Post</h2>
            <div className="flex flex-col items-center w-full">
                <Controller
                    control={control}
                    name="image"
                    render={({ field }) => (
                        <ImageInput
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.image?.message}
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
                {errors.image && (
                    <p className="text-xs text-red-500 mt-2">{errors.image.message}</p>
                )}
            </div>
            <div className="space-y-6">
                <InputField
                    label="Title"
                    {...register("title")}
                    error={errors.title?.message}
                />

                <Controller
                    control={control}
                    name="tags"
                    render={({ field }) => (
                        <TagInput
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.tags?.message}
                        />
                    )}
                />

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
            </div>
            <ThemeButton type="submit" isLoading={isPending} className="w-full mt-4">Create Post</ThemeButton>
        </form>
    );
};
