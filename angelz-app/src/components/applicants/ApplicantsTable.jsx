import useLocale from "../../hooks/useLocale";
import ApplicantRow from "./ApplicantRow";

export default function ApplicantsTable({ applicants = [] }) {
    const { t } = useLocale("missionDetails");
    return (
        <div className="rounded-xl shadow-lg bg-white overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-start min-w-[500px]">
                    <thead className="bg-gray-100 text-sm text-gray-700">
                        <tr>
                            <th className="px-3 py-2 font-medium">{t("applicants.profile")}</th>
                            <th className="px-3 py-2 font-medium">{t("applicants.name")}</th>
                            <th className="px-3 py-2 font-medium">{t("applicants.email")}</th>
                            <th className="px-3 py-2 font-medium">{t("applicants.points")}</th>
                        </tr>
                    </thead>

                    <tbody>
                        {applicants.map((applicant) => (
                            <ApplicantRow key={applicant.id} applicant={applicant} />
                        ))}
                        {applicants.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-6 text-gray-500">
                                    {t("applicants.empty")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
