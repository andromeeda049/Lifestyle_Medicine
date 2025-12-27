
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchLeaderboard } from '../services/googleSheetService';
import { TrophyIcon, StarIcon, MedalIcon, UserCircleIcon, FireIcon, UserGroupIcon, ChartBarIcon, ShareIcon } from './icons';
import { ORGANIZATIONS } from '../constants';

interface LeaderboardUser {
    username: string;
    displayName: string;
    profilePicture: string;
    xp: number;
    level: number;
    badges: string | string[];
    organization: string;
    role?: string;
}

interface OrgRanking {
    id: string;
    name: string;
    totalXp: number;
    memberCount: number;
    avgXp: number;
}

const Community: React.FC = () => {
    const { scriptUrl, currentUser, userProfile } = useContext(AppContext);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [trending, setTrending] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'trending' | 'orgs'>('users');
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    const loadData = async () => {
        setLoading(true);
        try {
            if (!scriptUrl) throw new Error("Config Missing");
            const data = await fetchLeaderboard(scriptUrl, currentUser || undefined);
            
            // Shared filtering logic
            const filterAdmins = (list: any[]) => {
                return list.filter((u: any) => {
                    const role = String(u.role || '').toLowerCase();
                    const username = String(u.username || '').toLowerCase();
                    const name = String(u.displayName || '').toLowerCase();
                    const org = String(u.organization || '').toLowerCase();
                    const isAdminRole = role === 'admin';
                    const isAdminUsername = username.startsWith('admin');
                    const hasAdminName = name.includes('admin');
                    const isSystemOrg = org === 'all';
                    return !isAdminRole && !isAdminUsername && !hasAdminName && !isSystemOrg;
                });
            };

            if (data) {
                if (Array.isArray(data.leaderboard)) {
                    const sorted = filterAdmins(data.leaderboard).sort((a: any, b: any) => b.xp - a.xp);
                    setLeaderboard(sorted);
                }
                if (Array.isArray(data.trending)) {
                    // Assuming trending comes sorted or we just take the list
                    const trendList = filterAdmins(data.trending);
                    setTrending(trendList);
                }
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

    // Calculate Organization Rankings based on filtered leaderboard
    const orgRankings = useMemo(() => {
        const stats: Record<string, { total: number, count: number }> = {};
        
        leaderboard.forEach(user => {
            const orgId = user.organization || 'other';
            if (!stats[orgId]) stats[orgId] = { total: 0, count: 0 };
            stats[orgId].total += (user.xp || 0);
            stats[orgId].count += 1;
        });

        const rankingList: OrgRanking[] = Object.keys(stats).map(orgId => {
            const orgInfo = ORGANIZATIONS.find(o => o.id === orgId);
            return {
                id: orgId,
                name: orgInfo ? orgInfo.name : (orgId === 'general' ? 'บุคคลทั่วไป' : 'อื่นๆ'),
                totalXp: stats[orgId].total,
                memberCount: stats[orgId].count,
                avgXp: stats[orgId].count > 0 ? Math.round(stats[orgId].total / stats[orgId].count) : 0
            };
        });

        return rankingList.sort((a, b) => b.totalXp - a.totalXp);
    }, [leaderboard]);

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

    const handleShare = async () => {
        if (!currentUser) return;

        const myXp = userProfile.xp?.toLocaleString() || '0';
        const rankText = myRankIndex !== -1 ? `🏆 ฉันอยู่อันดับที่ ${myRankIndex + 1} ของชุมชน` : '💪 ฉันกำลังสะสมแต้มสุขภาพ';
        
        const shareText = `
${rankText}
👤 ${currentUser.displayName} (Lv.${userProfile.level})
🔥 XP สะสม: ${myXp} แต้ม

มาร่วมเป็นสุดยอดผู้ดูแลสุขภาพประจำชุมชนกับฉันที่ Satun Smart Life!
#SatunSmartLife #สุขภาพดีที่สตูล
`.trim();

        const shareData = {
            title: 'Satun Smart Life Leaderboard',
            text: shareText,
            url: window.location.href // Or specific app URL
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText + "\n" + window.location.href);
                setCopyStatus('copied');
                setTimeout(() => setCopyStatus('idle'), 2500);
            } catch (err) {
                alert('ไม่สามารถแชร์ได้');
            }
        }
    };

    const renderHeader = () => {
        let title = "Leaderboard";
        let subtitle = "สุดยอดผู้ดูแลสุขภาพประจำชุมชน";
        let icon = <TrophyIcon className="w-32 h-32" />;
        let gradient = "from-orange-500 to-red-500";

        if (activeTab === 'trending') {
            title = "Trending Now";
            subtitle = "ผู้ใช้งานที่มาแรงในช่วงนี้";
            icon = <FireIcon className="w-32 h-32" />;
            gradient = "from-rose-500 to-pink-600";
        } else if (activeTab === 'orgs') {
            title = "Top Organizations";
            subtitle = "อันดับหน่วยงานส่งเสริมสุขภาพ";
            icon = <UserGroupIcon className="w-32 h-32" />;
            gradient = "from-teal-500 to-emerald-600";
        }

        return (
            <div className={`text-center mb-6 bg-gradient-to-r ${gradient} p-6 rounded-3xl text-white shadow-lg relative overflow-hidden transition-colors duration-500`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 animate-pulse">
                    {icon}
                </div>
                <h2 className="text-2xl font-bold relative z-10">{title}</h2>
                <p className="text-white/90 text-sm relative z-10">{subtitle}</p>
                
                {activeTab === 'users' && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2 relative z-10">
                        {myRankIndex !== -1 && (
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium border border-white/30">
                                <StarIcon className="w-4 h-4 text-yellow-300" />
                                <span>อันดับของคุณ: #{myRankIndex + 1}</span>
                            </div>
                        )}
                        <button 
                            onClick={handleShare}
                            className="inline-flex items-center gap-2 bg-white text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold shadow-md hover:bg-orange-50 transition-colors active:scale-95"
                        >
                            <ShareIcon className="w-4 h-4" />
                            {copyStatus === 'copied' ? 'คัดลอกแล้ว!' : 'อวดอันดับ'}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-t-yellow-500 border-gray-200 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
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

    // --- RENDER CONTENT BASED ON TABS ---

    const renderPodium = (list: LeaderboardUser[]) => {
        if (list.length === 0) return null;
        return (
            <div className="flex justify-center items-end gap-2 sm:gap-4 mb-8 h-48 sm:h-56">
                {/* Rank 2 */}
                {list[1] && (
                    <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{animationDelay: '0.1s'}}>
                        <div className="mb-2 relative">
                            {renderProfilePic(list[1].profilePicture, "w-12 h-12 sm:w-16 sm:h-16")}
                            <div className="absolute -bottom-2 -right-1 bg-gray-300 text-gray-700 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white">2</div>
                        </div>
                        <div className="text-center mb-1">
                            <p className="font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate w-20 sm:w-24">{list[1].displayName}</p>
                            <p className="text-[10px] text-gray-500">{(list[1].xp || 0).toLocaleString()} XP</p>
                        </div>
                        <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-gray-300 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-t-lg shadow-md flex items-end justify-center pb-2">
                            <MedalIcon className="w-8 h-8 text-gray-400" />
                        </div>
                    </div>
                )}
                {/* Rank 1 */}
                {list[0] && (
                    <div className="flex flex-col items-center w-1/3 z-10 animate-slide-up">
                        <div className="mb-2 relative">
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-2xl">👑</div>
                            {renderProfilePic(list[0].profilePicture, "w-16 h-16 sm:w-20 sm:h-20 border-4 border-yellow-400")}
                            <div className="absolute -bottom-2 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border border-white">1</div>
                        </div>
                        <div className="text-center mb-1">
                            <p className="font-bold text-sm sm:text-base text-gray-800 dark:text-white truncate w-24 sm:w-32">{list[0].displayName}</p>
                            <p className="text-xs font-bold text-yellow-600">{(list[0].xp || 0).toLocaleString()} XP</p>
                        </div>
                        <div className="w-full h-32 sm:h-40 bg-gradient-to-t from-yellow-400 to-yellow-200 dark:from-yellow-600 dark:to-yellow-500 rounded-t-lg shadow-lg flex items-end justify-center pb-4">
                            <TrophyIcon className="w-10 h-10 text-yellow-700 dark:text-yellow-900" />
                        </div>
                    </div>
                )}
                {/* Rank 3 */}
                {list[2] && (
                    <div className="flex flex-col items-center w-1/3 animate-slide-up" style={{animationDelay: '0.2s'}}>
                        <div className="mb-2 relative">
                            {renderProfilePic(list[2].profilePicture, "w-12 h-12 sm:w-16 sm:h-16")}
                            <div className="absolute -bottom-2 -right-1 bg-orange-300 text-orange-800 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white">3</div>
                        </div>
                        <div className="text-center mb-1">
                            <p className="font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate w-20 sm:w-24">{list[2].displayName}</p>
                            <p className="text-[10px] text-gray-500">{(list[2].xp || 0).toLocaleString()} XP</p>
                        </div>
                        <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-orange-300 to-orange-100 dark:from-orange-700 dark:to-orange-600 rounded-t-lg shadow-md flex items-end justify-center pb-2">
                            <MedalIcon className="w-8 h-8 text-orange-500 dark:text-orange-300" />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderUserList = (list: LeaderboardUser[], startIndex: number = 0) => {
        if (list.length === 0) return <p className="text-center py-8 text-gray-400 text-sm">ไม่มีข้อมูล</p>;
        
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <span className="font-bold text-gray-500 text-sm uppercase">รายชื่อ</span>
                    <span className="text-xs text-gray-400">Total XP</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {list.map((user, index) => {
                        const rank = startIndex + index + 1;
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
                                    {(user.xp || 0).toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderOrgList = () => {
        return (
            <div className="space-y-3">
                {orgRankings.map((org, index) => (
                    <div key={org.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center animate-slide-up" style={{animationDelay: `${index * 0.05}s`}}>
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg mr-4 ${
                            index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                            index === 1 ? 'bg-gray-100 text-gray-600' : 
                            index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-teal-50 text-teal-600'
                        }`}>
                            {index + 1}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 dark:text-white text-sm">{org.name}</h4>
                            <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><UserGroupIcon className="w-3 h-3"/> สมาชิก {org.memberCount} คน</span>
                                <span className="flex items-center gap-1"><ChartBarIcon className="w-3 h-3"/> เฉลี่ย {org.avgXp} XP</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-teal-600 dark:text-teal-400">{org.totalXp.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400">Total XP</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="animate-fade-in pb-24">
            {renderHeader()}

            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6 shadow-inner">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${activeTab === 'users' ? 'bg-white dark:bg-gray-700 text-orange-500 shadow-sm' : 'text-gray-500'}`}
                >
                    <TrophyIcon className="w-4 h-4" /> บุคคล
                </button>
                <button 
                    onClick={() => setActiveTab('trending')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${activeTab === 'trending' ? 'bg-white dark:bg-gray-700 text-rose-500 shadow-sm' : 'text-gray-500'}`}
                >
                    <FireIcon className="w-4 h-4" /> มาแรง
                </button>
                <button 
                    onClick={() => setActiveTab('orgs')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${activeTab === 'orgs' ? 'bg-white dark:bg-gray-700 text-teal-500 shadow-sm' : 'text-gray-500'}`}
                >
                    <UserGroupIcon className="w-4 h-4" /> หน่วยงาน
                </button>
            </div>

            {/* Content Switcher */}
            {activeTab === 'users' && (
                <>
                    {renderPodium(leaderboard.slice(0, 3))}
                    {renderUserList(leaderboard.slice(3), 3)}
                </>
            )}

            {activeTab === 'trending' && (
                <>
                    {trending.length > 0 ? (
                        <>
                            <p className="text-center text-xs text-rose-500 font-bold mb-4 animate-pulse">🔥 ผู้ที่มี XP เพิ่มขึ้นสูงสุดในสัปดาห์นี้</p>
                            {renderUserList(trending)}
                        </>
                    ) : (
                        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl">
                            <FireIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">ยังไม่มีข้อมูล Trending ในขณะนี้</p>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'orgs' && renderOrgList()}

            {/* My Rank Sticky (Users Tab Only) */}
            {activeTab === 'users' && myRankIndex > 2 && (
                <div className="fixed bottom-20 left-4 right-4 z-30 animate-slide-up">
                    <div className="bg-gray-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl flex items-center border border-gray-700">
                        <div className="w-10 font-bold text-yellow-400 text-center text-lg mr-2">#{myRankIndex + 1}</div>
                        <div className="mr-3">
                            {renderProfilePic(currentUser?.profilePicture || '', "w-10 h-10 border-2 border-yellow-400")}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm">อันดับของคุณ</p>
                            <p className="text-xs text-gray-300">{(leaderboard[myRankIndex]?.xp || 0).toLocaleString()} XP</p>
                        </div>
                        <button 
                            onClick={handleShare}
                            className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <ShareIcon className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
