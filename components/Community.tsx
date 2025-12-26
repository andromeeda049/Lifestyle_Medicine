
import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchLeaderboard } from '../services/googleSheetService';
import { StarIcon, TrophyIcon, UserGroupIcon } from './icons';
import { ORGANIZATIONS } from '../constants';

interface LeaderboardUser {
    username: string;
    displayName: string;
    profilePicture: string;
    xp: number;
    level: number;
    badges: string | string[]; // บางครั้ง Sheet ส่งมาเป็น JSON string
    organization?: string;
}

const Community: React.FC = () => {
    const { scriptUrl, currentUser } = useContext(AppContext);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'trending' | 'org'>('leaderboard');

    useEffect(() => {
        const loadData = async () => {
            if (scriptUrl) {
                const data = await fetchLeaderboard(scriptUrl);
                if (Array.isArray(data)) {
                    setLeaderboard(data);
                }
            }
            setLoading(false);
        };
        loadData();
    }, [scriptUrl]);

    const orgStats = React.useMemo(() => {
        const stats: { [key: string]: { name: string, totalXP: number, memberCount: number } } = {};
        ORGANIZATIONS.forEach(org => { stats[org.id] = { name: org.name, totalXP: 0, memberCount: 0 }; });

        leaderboard.forEach(user => {
            const orgId = user.organization || 'general';
            if (!stats[orgId]) stats[orgId] = { name: 'อื่นๆ', totalXP: 0, memberCount: 0 };
            stats[orgId].totalXP += (Number(user.xp) || 0);
            stats[orgId].memberCount += 1;
        });

        return Object.values(stats).filter(s => s.memberCount > 0).sort((a, b) => b.totalXP - a.totalXP);
    }, [leaderboard]);

    const RankItem: React.FC<{ user: LeaderboardUser; rank: number; isTrending?: boolean }> = ({ user, rank, isTrending }) => {
        const isMe = user.username === currentUser?.username;
        let rankDisplay;
        let bgClass = isMe ? "bg-teal-50 border-teal-500 dark:bg-teal-900/30" : "bg-white dark:bg-gray-700 border-transparent";
        
        if (isTrending) rankDisplay = <span className="text-green-500 font-bold">▲</span>;
        else {
            switch(rank) {
                case 1: rankDisplay = "🥇"; bgClass = "bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20"; break;
                case 2: rankDisplay = "🥈"; bgClass = "bg-gray-50 border-gray-400 dark:bg-gray-800"; break;
                case 3: rankDisplay = "🥉"; bgClass = "bg-orange-50 border-orange-400 dark:bg-orange-900/20"; break;
                default: rankDisplay = <span className="font-bold text-gray-500 w-6 text-center">{rank}</span>;
            }
        }

        return (
            <div className={`flex items-center p-3 rounded-xl border-l-4 shadow-sm mb-3 ${bgClass}`}>
                <div className="flex items-center justify-center w-8 text-2xl mr-3">{rankDisplay}</div>
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-200">
                        {user.profilePicture && user.profilePicture.length > 10 ? (
                            <img src={user.profilePicture} alt={user.displayName} className="w-full h-full object-cover"/>
                        ) : (
                            <span className="text-xl">{user.profilePicture || '👤'}</span>
                        )}
                    </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMe ? 'text-teal-700 dark:text-teal-300' : 'text-gray-800 dark:text-white'}`}>
                        {user.displayName} {isMe && '(ฉัน)'}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        {ORGANIZATIONS.find(o => o.id === user.organization)?.name || 'General'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{Number(user.xp).toLocaleString()} XP</p>
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded">Lvl {user.level}</span>
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ลำดับคนรักสุขภาพ</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">อัปเดตข้อมูลแบบ Real-time จากผู้ใช้งานในพื้นที่</p>
            </div>

            <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-6">
                <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500'}`}>🏆 รวมยอด</button>
                <button onClick={() => setActiveTab('org')} className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'org' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500'}`}>🏢 หน่วยงาน</button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-12">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm text-gray-500">กำลังเชื่อมต่อฐานข้อมูล...</p>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {activeTab === 'leaderboard' ? (
                        leaderboard.length > 0 ? leaderboard.map((user, index) => <RankItem key={index} user={user} rank={index + 1} />) : <p className="text-center py-10 text-gray-400">ยังไม่มีข้อมูล</p>
                    ) : (
                        orgStats.map((org, index) => (
                            <div key={index} className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-between mb-3">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${index === 0 ? 'bg-yellow-400' : 'bg-indigo-400'}`}>{index + 1}</div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-white text-sm">{org.name}</h4>
                                        <p className="text-[10px] text-gray-500">{org.memberCount} สมาชิก</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{org.totalXP.toLocaleString()}</p>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Total XP</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Community;
