import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const VolunteerProfileHeader = ({ volunteer }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center px-4 py-3 bg-white">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
      >
        <FaArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="ml-4 text-lg sm:text-xl font-semibold text-gray-700">
        {volunteer?.name || "Profile"}
      </h1>
    </div>
  );
};

export default VolunteerProfileHeader;