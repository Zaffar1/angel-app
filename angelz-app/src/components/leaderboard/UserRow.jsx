import { FaMapMarkerAlt, FaCaretUp, FaCaretDown } from 'react-icons/fa';
import { RankBadge, RankNumber } from './Badges';

const TrendIndicator = ({ trend, change }) => (
    <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
        {trend === 'up' ? <FaCaretUp className="w-3 h-3" /> : <FaCaretDown className="w-3 h-3" />}
        <span>{change}</span>
    </div>
);

export const UserRow = ({ user, rank }) => {
    const isTopFive = rank <= 5;
    return (
        <div className="grid grid-cols-12 items-center gap-4 px-4 sm:px-6 py-4 hover:bg-blue-50/50 transition-colors border-b border-gray-200/50 last:border-b-0">
            <div className="col-span-2 md:col-span-2 flex justify-start">
                {isTopFive ? (
                    <RankBadge rank={rank} userImage={user.image} userName={user.name} />
                ) : (
                    <RankNumber rank={rank} userImage={user.image} userName={user.name} />
                )}
            </div>

            <div className="col-span-4 md:col-span-4">
                <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                                {user.name}
                            </h3>
                            <TrendIndicator trend={user.trend} change={user.change} />
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {user.email}
                        </p>
                    </div>
                </div>
            </div>

            <div className="col-span-3 md:col-span-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                    <div className="hidden sm:flex items-center gap-1">
                        <span className="truncate">{user.city}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 text-sm truncate">{user.country}</span>
                    </div>
                    <div className="sm:hidden">
                        <span className="truncate">{user.city}</span>
                    </div>
                </div>
            </div>

            <div className="col-span-3 text-right">
                <div className="text-lg sm:text-xl font-bold text-blue-600">
                    {user?.points}
                </div>
                <div className="text-xs text-gray-500 font-medium">points</div>
            </div>
        </div>
    );
};