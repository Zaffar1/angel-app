import { AvatarImage } from "./AvatarImage";

export default function ProfileWithAvatar({ user }) {
  return (
    <div className="flex items-center gap-5">
      <AvatarImage src={user?.image} alt={user?.name || "User Avatar"} />
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {user?.name || "Guest User"}
        </h2>
        <p className="text-sm text-gray-500">
          @{user?.username || user?.email?.split("@")[0] || "anonymous"}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-700">
          {user?.points || 0} Points Earned
        </p>
      </div>
    </div>
  );
}
