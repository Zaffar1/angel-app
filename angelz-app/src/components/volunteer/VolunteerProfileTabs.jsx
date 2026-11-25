import { useState } from 'react'
import useLocale from "../../hooks/useLocale";
import { FaCheckCircle, FaClock, FaNewspaper } from 'react-icons/fa';
import Feed from '../FeedCard';
import MissionCard from '../mission/missionCard';
import FeedCardComponent from '../FeedCardComponent';

const VolunteerProfileTabs = ({ volunteer }) => {
  const { t } = useLocale("volunteer");
  const [activeTab, setActiveTab] = useState("Feed");

  const tabs = [
    { key: "Feed", label: t("profile.tabs.feed"), icon: <FaNewspaper className="w-4 h-4" /> },
    { key: "Completed Acts", label: t("profile.tabs.completedActs"), icon: <FaCheckCircle className="w-4 h-4" /> },
    { key: "All Acts", label: t("profile.tabs.allActs"), icon: <FaClock className="w-4 h-4" /> },
  ];

  return (
    <div className="px-6 pt-4 pb-6">
      <div className="flex flex-wrap gap-3 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center justify-center gap-2 min-h-[47px] w-[340px] max-w-full px-3 rounded-full text-sm font-medium transition-all duration-200
              ${activeTab === tab.key
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        {activeTab === "Feed" && (
          <div className="max-w-xl mx-auto space-y-6">
            {volunteer?.feeds?.length > 0 ? volunteer?.feeds?.map((feed) => (
              <FeedCardComponent key={feed?.id} {...feed} />
            ))
              :
              <p>{t("profile.noData")}</p>
            }
          </div>
        )}
        {activeTab === "Completed Acts" && <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {volunteer?.completed_missions?.length > 0 ? volunteer?.completed_missions?.map((mission) => (
              <MissionCard key={mission?.id} {...mission} />
            ))
              :
              <p>{t("profile.noData")}</p>
            }
          </div>
        </div>
        }
        {activeTab === "All Acts" && <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {volunteer?.assigned_missions?.length > 0 ? volunteer?.assigned_missions?.map((mission) => (
              <MissionCard key={mission?.id} {...mission} />
            ))
              :
              <p>{t("profile.noData")}</p>
            }
          </div>
        </div>}
      </div>
    </div>
  );
}
export default VolunteerProfileTabs
