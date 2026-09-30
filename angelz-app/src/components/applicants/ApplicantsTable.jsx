import ApplicantRow from "./ApplicantRow";

export default function ApplicantsTable({ applicants = [] }) {
    return (
        <div className="rounded-xl shadow-lg bg-white overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-gray-100 text-sm text-gray-700">
                        <tr>
                            <th className="px-3 py-2 font-medium">Profile</th>
                            <th className="px-3 py-2 font-medium">Name</th>
                            <th className="px-3 py-2 font-medium">Email</th>
                            <th className="px-3 py-2 font-medium">Points</th>
                        </tr>
                    </thead>

                    <tbody>
                        {applicants.map((applicant) => (
                            <ApplicantRow key={applicant.id} applicant={applicant} />
                        ))}
                        {applicants.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-6 text-gray-500">
                                    No applicants yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
