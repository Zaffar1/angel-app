import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import Loader from "../component/Loader";
import { updateItem } from "../utils/Api";

const EditBadge = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  console.log("Badge ID from URL:", id);

  // USE THE CUSTOM HOOK (NOT fetch)
  const { data, loading, error } = useFetch(`/admin/badges/${id}`);

  console.log("API raw response:", data);
  console.log("Loading state:", loading);
  console.log("Error state:", error);

  const [form, setForm] = useState({
    title: "",
    min_points: "",
    max_points: "",
    status: "active",
    description: "",
  });

  const [saving, setSaving] = useState(false);

  /* Populate form when API data arrives */
  useEffect(() => {
    if (data?.badge) {
      console.log("Badge data received:", data.data);

      const badge = data.badge;

      setForm({
        title: badge.title ?? "",
        min_points: badge.min_points ?? "",
        max_points: badge.max_points ?? "",
        status: badge.status ?? "active",
        description: badge.description ?? "",
      });
    } else {
      console.log("No badge data yet");
    }
  }, [data]);

  /* Handle input change */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "min_points" || name === "max_points"
          ? value === "" ? "" : Number(value)
          : value,
    }));
  };
   
  /* Submit updated badge */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    console.log("Submitting form data:", form);

    try {
      await updateItem(`/admin/badges/${id}`, form);

      alert("Badge updated successfully!");
      navigate("/badges");
    } catch (err) {
    // console.error("Update error:", err);

    const errorMessage =
      err?.response?.data?.message ||
      err?.message ||
      "Something went wrong";

    alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /* Loading state */
  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <Loader />
      </div>
    );
  }

  /* Error state */
  if (error) {
    return (
      <div className="text-center mt-20 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Edit Badge</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Title */}
        <div>
          <label className="block mb-1 font-medium">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Points */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Min Points</label>
            <input
              type="number"
              name="min_points"
              value={form.min_points}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Max Points</label>
            <input
              type="number"
              name="max_points"
              value={form.max_points}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block mb-1 font-medium">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-admin_primary text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Badge"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/badges")}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditBadge;


// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import useFetch from "../hooks/useFetch";
// import Loader from "../component/Loader";
// import { updateItem } from "../utils/Api";

// const EditBadge = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const { data, loading, error } = fetch(`/admin/badges/${id}`);

//   const [form, setForm] = useState({
//     title: "",
//     min_points: "",
//     max_points: "",
//     status: "active",
//     description: "",
//   });

//   const [saving, setSaving] = useState(false);

//   /* Populate form */
//   useEffect(() => {
//     if (data?.data) {
//       const badge = data.data;

//       setForm({
//         title: badge.title ?? "",
//         min_points: badge.min_points ?? "",
//         max_points: badge.max_points ?? "",
//         status: badge.status ?? "active",
//         description: badge.description ?? "",
//       });
//     }
//   }, [data]);

//   /* Handle input change */
//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setForm((prev) => ({
//       ...prev,
//       [name]:
//         name === "min_points" || name === "max_points"
//           ? value === "" ? "" : Number(value)
//           : value,
//     }));
//   };

//   /* Submit updated badge */
// const handleSubmit = async (e) => {
//   e.preventDefault();
//   setSaving(true);

//   try {
//     await updateItem(`/admin/badges/${id}`, form);

//     alert("Badge updated successfully!");
//     navigate("/badges");
//   } catch (err) {
//     alert(err.message || "Something went wrong");
//   } finally {
//     setSaving(false);
//   }
// };

//   if (loading) {
//     return (
//       <div className="flex justify-center mt-20">
//         <Loader />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center mt-20 text-red-600">
//         {error}
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-xl mx-auto p-4 bg-white shadow rounded">
//       <h2 className="text-xl font-semibold mb-4">Edit Badge</h2>

//       <form onSubmit={handleSubmit} className="space-y-4">

//         {/* Title */}
//         <div>
//           <label className="block mb-1 font-medium">Title</label>
//           <input
//             name="title"
//             value={form.title}
//             onChange={handleChange}
//             required
//             className="w-full border px-3 py-2 rounded"
//           />
//         </div>

//         {/* Points */}
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <label className="block mb-1 font-medium">Min Points</label>
//             <input
//               type="number"
//               name="min_points"
//               value={form.min_points}
//               onChange={handleChange}
//               required
//               className="w-full border px-3 py-2 rounded"
//             />
//           </div>

//           <div>
//             <label className="block mb-1 font-medium">Max Points</label>
//             <input
//               type="number"
//               name="max_points"
//               value={form.max_points}
//               onChange={handleChange}
//               required
//               className="w-full border px-3 py-2 rounded"
//             />
//           </div>
//         </div>

//         {/* Status */}
//         <div>
//           <label className="block mb-1 font-medium">Status</label>
//           <select
//             name="status"
//             value={form.status}
//             onChange={handleChange}
//             className="w-full border px-3 py-2 rounded"
//           >
//             <option value="active">Active</option>
//             <option value="inactive">Inactive</option>
//           </select>
//         </div>

//         {/* Description */}
//         <div>
//           <label className="block mb-1 font-medium">Description</label>
//           <textarea
//             name="description"
//             value={form.description}
//             onChange={handleChange}
//             className="w-full border px-3 py-2 rounded"
//           />
//         </div>

//         {/* Buttons */}
//         <div className="flex gap-2">
//           <button
//             type="submit"
//             disabled={saving}
//             className="bg-admin_primary text-white px-4 py-2 rounded disabled:opacity-50"
//           >
//             {saving ? "Updating..." : "Update Badge"}
//           </button>

//           <button
//             type="button"
//             onClick={() => navigate("/badges")}
//             className="border px-4 py-2 rounded"
//           >
//             Cancel
//           </button>
//         </div>

//       </form>
//     </div>
//   );
// };

// export default EditBadge;
