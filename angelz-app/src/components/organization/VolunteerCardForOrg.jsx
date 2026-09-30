import { getImageUrl } from "../../utils/getImageUrl";

export default function VolunteerCardForOrg({ vol }) {
    return (
        <div className="glass-card transition-all duration-300 p-6 max-w-md w-full h-full flex flex-col justify-between">
            <div>
                {/* Header */}
                <div className="flex items-start justify-between">

                    {/* Profile Info */}
                    <div className="flex items-center gap-4">
                        <img
                            src={
                                vol.image
                                    ? getImageUrl(vol.image)
                                    : `https://ui-avatars.com/api/?name=${vol.name}`
                            }
                            alt={vol.name}
                            className="w-16 h-16 rounded-full object-cover 
                                       border border-gray-300 shadow-sm"
                        />

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {vol.name || "Volunteer"}
                            </h3>

                            <p className="text-sm text-gray-500">
                                Volunteer Member
                            </p>
                        </div>
                    </div>

                    {/* Points Badge */}
                    <span className="px-3 py-1 text-xs font-semibold 
                                     bg-blue-50 text-blue-700 rounded-full">
                        ⭐ {vol.points ?? 20} Points
                    </span>
                </div>

                {/* Divider */}
                <div className="my-5 border-t border-gray-200"></div>

                {/* Details */}
                <div className="space-y-4">

                    <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            Email Address
                        </p>
                        <p className="text-gray-800 text-sm truncate">
                            {vol.email || "Not Provided"}
                        </p>
                    </div>

                    {vol.contact_no && (
                        <div>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                Contact Number
                            </p>
                            <p className="text-gray-800 text-sm">
                                {vol.contact_no}
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
