import { useNavigate } from "react-router-dom";
import useLocale from "../hooks/useLocale";

export default function NotFound({ section }) {
    const navigate = useNavigate();
    const { t } = useLocale("shared");
    const sectionLabel = section ? t(`notFound.sections.${section}`, { defaultValue: section }) : "";

    const handleRedirect = (path) => navigate(path);

    if (!section) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-2">{t("notFound.title")}</h1>
                <p className="text-gray-600 mb-4">
                    {t("notFound.message")}
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => handleRedirect("/")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {t("notFound.goHome")}
                    </button>
                    <button
                        onClick={() => handleRedirect("/organization")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {t("notFound.goOrganization")}
                    </button>
                    <button
                        onClick={() => handleRedirect("/volunteer")}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        {t("notFound.goVolunteer")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">{t("notFound.title")}</h1>
            <p className="text-gray-600 mb-4">
                {t("notFound.sectionMessage", { section: sectionLabel })}
            </p>
            <button
                onClick={() => handleRedirect(`/${section}`)}
                className="text-blue-600 hover:underline"
            >
                {t("notFound.sectionBack", { section: sectionLabel })}
            </button>
        </div>
    );
}
