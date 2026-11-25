import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import useLocale from "../../hooks/useLocale";

const VolunteerProfileHeader = ({ volunteer }) => {
  const { t } = useLocale("volunteer");
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
        title={t("profile.goBack")}
        aria-label={t("profile.goBack")}
      >
        <FaChevronLeft className="w-5 h-5 rtl:rotate-180" />
      </button>
      <h1 className="text-lg sm:text-xl font-semibold text-gray-700">
        {t("profile.title")}
      </h1>
    </div>
  );
};

export default VolunteerProfileHeader;
