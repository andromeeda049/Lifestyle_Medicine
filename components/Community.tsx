
import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchLeaderboard } from '../services/googleSheetService';
import { UserProfile } from '../types';
import { StarIcon, TrophyIcon, UserGroupIcon, FireIcon, WaterDropIcon, ChartBarIcon } from './icons';
import { ORGANIZATIONS } from '../constants';

interface LeaderboardUser {
    username: string;
    displayName: string;
    profilePicture: string;
    xp: number;
    level: number;
    badges: string[];
    organization?: string; // Add org field
}

const Community: React.FC = () => {
    const { scriptUrl, userProfile, currentUser } = useContext(AppContext);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'challenge' | 'org'>('leaderboard');

    useEffect(() => {
        const loadData = async () => {
            if (scriptUrl) {
                const data = await fetchLeaderboard(scriptUrl);
                setLeaderboard(data);
            }
            setLoading(false);
        };
        loadData();
    }, [scriptUrl]);

    // Calculate community aggregate stats
    const totalXP = leaderboard.reduce((sum, user) => sum + (user.xp || 0), 0);
    const totalMembers = leaderboard.length;

    // Calculate Organization Stats
    const orgStats = React.useMemo(() => {
        const stats: { [key: string]: { name: string, totalXP: number, memberCount: number } } = {};
        
        // Initialize from constants to have nice names
        ORGANIZATIONS.forEach(org => {
            stats[org.id] = { name: org.name, totalXP: 0, memberCount: 0 };
        });

        leaderboard.forEach(user => {
            const orgId = user.organization || 'general';
            if (!stats[orgId]) {
                stats[orgId] = { name: 'อื่นๆ', totalXP: 0, memberCount: 0 };
            }
            stats[orgId].totalXP += (user.xp || 0);
            stats[orgId].memberCount += 1;
        });

        return Object.values(stats)
            .filter(s => s.memberCount > 0)
            .sort((a, b) => b.totalXP - a.totalXP);
    }, [leaderboard]);

    const RankItem: React.FC<{ user: LeaderboardUser; rank: number }> = ({ user, rank }) => {
        const isMe = user.username === currentUser?.username;
        let rankDisplay;
        let bgClass = isMe ? "bg-teal-50 border-teal-500 dark:bg-teal-900/30" : "bg-white dark:bg-gray-700 border-transparent";
        
        switch(rank) {
            case 1: rankDisplay = "🥇"; bgClass = "bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20"; break;
            case 2: rankDisplay = "🥈"; bgClass = "bg-gray-50 border-gray-400 dark:bg-gray-800"; break;
            case 3: rankDisplay = "🥉"; bgClass = "bg-orange-50 border-orange-400 dark:bg-orange-900/20"; break;
            default: rankDisplay = <span className="font-bold text-gray-500 w-6 text-center">{rank}</span>;
        }

        return (
            <div className={`flex items-center p-3 rounded-xl border-l-4 shadow-sm mb-3 ${bgClass}`}>
                <div className="flex items-center justify-center w-8 text-2xl mr-3">
                    {rankDisplay}
                </div>
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-200">
                        {user.profilePicture && user.profilePicture.length > 5 ? (
                            <img src={user.profilePicture} alt={user.displayName} className="w-full h-full object-cover"/>
                        ) : (
                            <span className="text-xl">{user.profilePicture || '👤'}</span>
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white text-[9px] px-1 rounded-full font-bold">
                        Lvl {user.level}
                    </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMe ? 'text-teal-700 dark:text-teal-300' : 'text-gray-800 dark:text-white'}`}>
                        {user.displayName} {isMe && '(ฉัน)'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {ORGANIZATIONS.find(o => o.id === user.organization)?.name || 'General'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{user.xp.toLocaleString()} XP</p>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg w-full animate-fade-in">
            <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full">
                        <UserGroupIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ชุมชนคนรักสุขภาพ</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
                    ร่วมสร้างสุขภาพดีไปพร้อมกับเพื่อนๆ ในหน่วยงานและชุมชน
                </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-6">
                <button 
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    🏆 บุคคล
                </button>
                <button 
                    onClick={() => setActiveTab('org')}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'org' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    🏢 หน่วยงาน
                </button>
                <button 
                    onClick={() => setActiveTab('challenge')}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'challenge' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    🔥 ภารกิจรวม
                </button>
            </div>

            {activeTab === 'leaderboard' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Top 20 Active Users</h3>
                        <span className="text-xs text-gray-500">อัปเดตล่าสุด: วันนี้</span>
                    </div>
                    
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {leaderboard.length > 0 ? (
                                leaderboard.map((user, index) => (
                                    <RankItem key={index} user={user} rank={index + 1} />
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">ยังไม่มีข้อมูลในกระดานผู้นำ</p>
                            )}
                        </div>
                    )}
                    
                    {/* User's current standing (if not in top list) */}
                    {!loading && leaderboard.length > 0 && !leaderboard.find(u => u.username === currentUser?.username) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-center text-gray-500 mb-2">อันดับของคุณ</p>
                            <RankItem 
                                user={{
                                    username: currentUser?.username || '',
                                    displayName: currentUser?.displayName || 'Guest',
                                    profilePicture: currentUser?.profilePicture || '👤',
                                    xp: userProfile.xp || 0,
                                    level: userProfile.level || 1,
                                    badges: userProfile.badges || [],
                                    organization: userProfile.organization
                                }} 
                                rank={999} 
                            />
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'org' && (
                <div className="animate-fade-in space-y-4">
                    <div className="text-center mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-white">อันดับหน่วยงานสุขภาพดี</h3>
                        <p className="text-xs text-gray-500">คำนวณจาก XP รวมของสมาชิกในหน่วยงาน</p>
                    </div>
                    
                    {orgStats.map((org, index) => (
                        <div key={index} className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-indigo-400'}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm">{org.name}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{org.memberCount} สมาชิก</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-indigo-600 dark:text-indigo-400">{org.totalXP.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-400">Total XP</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'challenge' && (
                <div className="animate-fade-in space-y-6">
                    {/* Community Goal 1 */}
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                            <WaterDropIcon className="w-24 h-24" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">เป้าหมาย: ดื่มน้ำ 10,000 ลิตร</h3>
                        <p className="text-blue-100 text-sm mb-4">พลังรวมของชุมชนเดือนนี้</p>
                        
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-blue-100">
                                        {(totalXP * 0.5).toLocaleString()} / 10,000 ลิตร (จำลอง)
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded bg-blue-800/30">
                                <div style={{ width: "65%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white/30"></div>
                            </div>
                        </div>
                        <p className="text-xs text-blue-100 italic">"น้ำคือชีวิต ช่วยกันดื่มน้ำให้เพียงพอนะครับ"</p>
                    </div>

                    {/* Community Goal 2 */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                            <FireIcon className="w-24 h-24" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">เป้าหมาย: เผาผลาญ 1 ล้าน Kcal</h3>
                        <p className="text-orange-100 text-sm mb-4">ภารกิจพิชิตพุงระดับจังหวัด</p>
                        
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-orange-100">
                                        {(totalXP * 1.2).toLocaleString()} / 1,000,000 Kcal (จำลอง)
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded bg-red-900/30">
                                <div style={{ width: "42%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white/30"></div>
                            </div>
                        </div>
                        <p className="text-xs text-orange-100 italic">"ขยับกายวันละนิด จิตแจ่มใส"</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center">
                        <TrophyIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <h4 className="font-bold text-gray-700 dark:text-gray-200">สมาชิกชุมชน</h4>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 my-1">{totalMembers.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">คนรักสุขภาพ</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
