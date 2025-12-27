
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchLeaderboard } from '../services/googleSheetService';
import { TrophyIcon, StarIcon, MedalIcon, UserCircleIcon, FireIcon } from './icons';

interface LeaderboardUser {
    username: string;
    displayName: string;
    profilePicture: string;
    xp: number;
    level: number;
    badges: string | string[];
    organization: string;
}

const Community: React.FC = () => {
    const { scriptUrl, currentUser } = useContext(AppContext);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            if (!scriptUrl) throw new Error("Config Missing");
            // Pass currentUser to satisfy backend validation
            const data = await fetchLeaderboard(scriptUrl, currentUser || undefined);
            
            if (data && Array.isArray(data.leaderboard)) {
                // Ensure sorting by XP descending just in case
                const sorted = data.leaderboard.sort((a, b) => b.xp - a.xp);
                setLeaderboard(sorted);
            }
        } catch (err: any) {
            console.error("Leaderboard Error:", err);
            setError("ไม่สามารถโหลดข้อมูลจัดอันดับได้ในขณะนี้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [scriptUrl]);

    const myRankIndex = useMemo(() => {
        if (!currentUser || leaderboard.length === 0) return -1;
        return leaderboard.findIndex(u => u.username === currentUser.username);
    }, [leaderboard, currentUser]);

    const renderProfilePic = (pic: string, sizeClass: string = "w-10 h-10") => {
        const isUrl = pic && (pic.startsWith('http') || pic.startsWith('data:'));
        if (isUrl) {
            return <img src={pic} alt="Profile" className={`${sizeClass} rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm`} />;
        }
        return (
            <div className={`${sizeClass} rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm`}>
                <span className="text-lg">{pic || '👤'}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-t-yellow-500 border-gray-200 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-medium">กำลังโหลดอันดับผู้พิชิตสุขภาพ...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800">
                <p className="text-red-500 font-bold mb-2">เกิดข้อผิดพลาด</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                <button onClick={loadData} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors">
                    ลองใหม่อีกครั้ง
                </button>
            </div>
        );
    }

    const topThree = leaderboard.slice(0, 3);
    const restList = leaderboard.slice(3);

    return (
        <div className="animate-fade-in pb-24">
            {/* Header */}
            <div className="text-center mb-8 bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrophyIcon className="w-32 h-32" />
                </div>
                <h2 className="text-2xl font-bold relative z-10">Leaderboard</h2>
                <p className="text-orange-100 text-sm relative z-10">สุดยอดผู้ดูแลสุขภาพประจำชุมชน</p>
                
                {myRankIndex !== -1 && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/30 relative z-10">
                        <StarIcon className="w-4 h-4 text-yellow-300" />
                        <span>อันดับของคุณ: #{myRankIndex + 1}</span>
                    </div>
                )}
            </div>

            {/* Podium (Top 3) */}
            {topThree.length > 0 && (
                <div className="flex justify-center items-end gap-2 sm:gap-4 mb-8 h-48 sm:h-56">
                    {/* Rank 2 */}
                    {topThree[1] && (
                        <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{animationDelay: '0.1s'}}>
                            <div className="mb-2 relative">
                                {renderProfilePic(topThree[1].profilePicture, "w-12 h-12 sm:w-16 sm:h-16")}
                                <div className="absolute -bottom-2 -right-1 bg-gray-300 text-gray-700 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white">2</div>
                            </div>
                            <div className="text-center mb-1">
                                <p className="font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate w-20 sm:w-24">{topThree[1].displayName}</p>
                                <p className="text-[10px] text-gray-500">{topThree[1].xp.toLocaleString()} XP</p>
                            </div>
                            <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-gray-300 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-t-lg shadow-md flex items-end justify-center pb-2">
                                <MedalIcon className="w-8 h-8 text-gray-400" />
                            </div>
                        </div>
                    )}

                    {/* Rank 1 */}
                    {topThree[0] && (
                        <div className="flex flex-col items-center w-1/3 z-10 animate-slide-up">
                            <div className="mb-2 relative">
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-2xl">👑</div>
                                {renderProfilePic(topThree[0].profilePicture, "w-16 h-16 sm:w-20 sm:h-20 border-4 border-yellow-400")}
                                <div className="absolute -bottom-2 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border border-white">1</div>
                            </div>
                            <div className="text-center mb-1">
                                <p className="font-bold text-sm sm:text-base text-gray-800 dark:text-white truncate w-24 sm:w-32">{topThree[0].displayName}</p>
                                <p className="text-xs font-bold text-yellow-600">{topThree[0].xp.toLocaleString()} XP</p>
                            </div>
                            <div className="w-full h-32 sm:h-40 bg-gradient-to-t from-yellow-400 to-yellow-200 dark:from-yellow-600 dark:to-yellow-500 rounded-t-lg shadow-lg flex items-end justify-center pb-4">
                                <TrophyIcon className="w-10 h-10 text-yellow-700 dark:text-yellow-900" />
                            </div>
                        </div>
                    )}

                    {/* Rank 3 */}
                    {topThree[2] && (
                        <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{animationDelay: '0.2s'}}>
                            <div className="mb-2 relative">
                                {renderProfilePic(topThree[2].profilePicture, "w-12 h-12 sm:w-16 sm:h-16")}
                                <div className="absolute -bottom-2 -right-1 bg-orange-300 text-orange-800 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white">3</div>
                            </div>
                            <div className="text-center mb-1">
                                <p className="font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate w-20 sm:w-24">{topThree[2].displayName}</p>
                                <p className="text-[10px] text-gray-500">{topThree[2].xp.toLocaleString()} XP</p>
                            </div>
                            <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-orange-300 to-orange-100 dark:from-orange-700 dark:to-orange-600 rounded-t-lg shadow-md flex items-end justify-center pb-2">
                                <MedalIcon className="w-8 h-8 text-orange-500 dark:text-orange-300" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* List (Rank 4+) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <span className="font-bold text-gray-500 text-sm uppercase">อันดับอื่นๆ</span>
                    <span className="text-xs text-gray-400">Total XP</span>
                </div>
                {restList.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {restList.map((user, index) => {
                            const rank = index + 4;
                            const isMe = user.username === currentUser?.username;
                            return (
                                <div key={index} className={`flex items-center p-4 ${isMe ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'} transition-colors`}>
                                    <div className="w-8 font-bold text-gray-400 text-center mr-3">{rank}</div>
                                    <div className="mr-3">
                                        {renderProfilePic(user.profilePicture, "w-10 h-10")}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold truncate text-sm ${isMe ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-800 dark:text-white'}`}>
                                                {user.displayName} {isMe && '(ฉัน)'}
                                            </p>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">Lv.{user.level}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">{user.organization || 'ทั่วไป'}</p>
                                    </div>
                                    <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                                        {user.xp.toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center py-8 text-gray-400 text-sm">ยังไม่มีข้อมูลอันดับเพิ่มเติม</p>
                )}
            </div>

            {/* My Rank Sticky (If not in top 3 and scrolled down - simulated by just always showing if rank > 3) */}
            {myRankIndex > 2 && (
                <div className="fixed bottom-20 left-4 right-4 z-30 animate-slide-up">
                    <div className="bg-gray-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl flex items-center border border-gray-700">
                        <div className="w-10 font-bold text-yellow-400 text-center text-lg mr-2">#{myRankIndex + 1}</div>
                        <div className="mr-3">
                            {renderProfilePic(currentUser?.profilePicture || '', "w-10 h-10 border-2 border-yellow-400")}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">อันดับของคุณ</p>
                            <p className="text-xs text-gray-300">{leaderboard[myRankIndex]?.xp.toLocaleString()} XP</p>
                        </div>
                        <div className="text-xs text-gray-400">
                            สู้ต่อไป! 🔥
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
