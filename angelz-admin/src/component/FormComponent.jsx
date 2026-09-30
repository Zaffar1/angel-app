import React, { useState } from "react";
import { useForm } from "react-hook-form";
import TextEditor from "./RTE"; // Adjust the import path as necessary

const FormComponent = () => {
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: {
      content: "",
    },
  });

  const [showContent, setShowContent] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  // Handle submit with validation
  // const onSubmit = (data) => {
  //   if (!data.content) {
  //     // If content is empty, set error
  //     setError("content", { type: "manual", message: "Content is required" });
  //     return;
  //   }
  //   console.log(data); // Log data when valid
  // };

  // Show content only if validation passes
  const handleShowContent = () => {
    const contentValue = getValues("content");
    if (!contentValue) {
      setError("content", { type: "manual", message: "Content is required" });
      return;
    }
    setEditorContent(contentValue);
    setShowContent(true);
  };

  return (
    <div className="w-full">
      <h2 className="text-lg sm:text-lg font-bold text-admin_text_grey mb-3 capitalize">
        Add terms and policy here
      </h2>
      <form>
        <TextEditor
          label="Description"
          name="content"
          control={control}
          defaultValue=""
          rules={{ required: "Content is required" }} // Required validation
        />
        {errors.content && (
          <p className="text-sm text-red-500">{errors.content.message}</p>
        )}

        <div className="mt-1">
          <button
            type="button"
            onClick={handleShowContent}
            className="p-2 bg-admin_primary text-white rounded hover:bg-pink-700 mr-2"
          >
            Add Terms
          </button>
        </div>
      </form>

      {showContent && (
        <div className="mt-10 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-2 px-2 py-2 bg-admin_dark text-white rounded-tr-lg rounded-tl-lg">
            Terms Content
          </h3>
          <div
            className="px-2 py-2"
            style={{ whiteSpace: "pre-wrap" }}
            dangerouslySetInnerHTML={{ __html: editorContent }}
          />
        </div>
      )}
    </div>
  );
};

export default FormComponent;
