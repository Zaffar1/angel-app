import ProfileWithAvatar from "../ProfileWithAvatar";
import ProfileBadge from "../ProfileBadge";
import Loader from "../Loader";

const VolunteerProfileInfo = ({ volunteer }) => {
  if (!volunteer) return <Loader />;

  return (
    <section>
      <div className="flex items-center justify-between">
        <ProfileWithAvatar user={volunteer} />
        <ProfileBadge rank={volunteer?.rank} />
      </div>
    </section>
  );
};

export default VolunteerProfileInfo;