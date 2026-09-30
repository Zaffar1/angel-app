import { AvatarImage } from "../AvatarImage";

export default function ApplicantRow({ applicant }) {
    return (
        <tr className="hover:bg-gray-50 transition overflow-hidden">
            <td className="px-3 py-2">
                <AvatarImage src={applicant?.image} size="38px" />
            </td>

            <td className="px-3 py-2 font-medium">{applicant.name}</td>

            <td className="px-3 py-2 text-sm text-gray-600">
                {applicant.email}
            </td>

            <td className="px-3 py-2 text-sm text-gray-600">
                {applicant.points ?? "-"}
            </td>
        </tr>
    );
}
