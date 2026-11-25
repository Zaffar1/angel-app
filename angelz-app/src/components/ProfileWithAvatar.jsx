import useLocale from "../hooks/useLocale";
import { AvatarImage } from "./AvatarImage";

export default function ProfileWithAvatar({ user }) {
  const { t } = useLocale("volunteer");
  return (
    <div className="flex items-center gap-5">
      <AvatarImage src={user?.image} alt={user?.name || t("profile.userAvatar")} />
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {user?.name || t("profile.guestUser")}
        </h2>
        <p className="text-sm text-gray-500">
          @{user?.username || user?.email?.split("@")[0] || t("profile.anonymous")}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-700">
          {t("profile.pointsEarned", { count: user?.points || 0 })}
        </p>
      </div>
    </div>
  );
}
