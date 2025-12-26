
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { fetchLeaderboard } from '../services/googleSheetService';
import { TrophyIcon, UserGroupIcon, FireIcon } from './icons';
import { ORGANIZATIONS } from '../constants';

interface LeaderboardUser {
    username: string;
    displayName: string;
    profilePicture: string;
    xp: number;
    level: number;
    organization: string;
    weeklyXp?: number;
}

const Community: React.FC = () => {
    const { scriptUrl, currentUser } = useContext(AppContext);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [trending, setTrending] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'trending' | 'org'>('leaderboard');

    useEffect(() => {
        const loadData = async () => {
            if (scriptUrl) {
                setLoading(true);
                try {
                    const data = await fetchLeaderboard(scriptUrl);
                    if (data) {
                        // Filter out admin users (username starts with 'admin_')
                        const cleanLeaderboard = (data.leaderboard || []).filter((u: any) => 
                            !String(u.username || u.Col2 || '').startsWith('admin_')
                        );
                        const cleanTrending = (data.trending || []).filter((u: any) => 
                            !String(u.username || u.Col2 || '').startsWith('admin_')
                        );
                        
                        setLeaderboard(cleanLeaderboard);
                        setTrending(cleanTrending);
                    }
                } catch (error) {
                    console.error("Failed to load community data:", error);
                }
            }
            setLoading(false);
        };
        loadData();
    }, [scriptUrl]);

    // ฟังก์ชันช่วยดึงค่าจาก Object โดยไม่สนใจ Key ที่ Google Sheets อาจจะเติมคำนำหน้ามา
    const getValueByKey = (obj: any, searchKey: string) => {
        if (obj[searchKey] !== undefined) return obj[searchKey];
        // ลองหาแบบมีคำนำหน้า เช่น "MAX displayName"
        const foundKey = Object.keys(obj).find(k => k.toLowerCase().includes(searchKey.toLowerCase()));
        return foundKey ? obj[foundKey] : undefined;
    };

    const sanitizeUser = (raw: any): LeaderboardUser => {
        return {
            username: raw.username || raw.Col2 || "",
            displayName: getValueByKey(raw, 'displayName') || raw.username || "Unknown",
            profilePicture: getValueByKey(raw, 'profilePicture') || "👤",
            xp: Number(getValueByKey(raw, 'totalXp') || getValueByKey(raw, 'xp') || 0),
            level: Number(getValueByKey(raw, 'level') || 1),
            organization: String(getValueByKey(raw, 'organization') || "general"),
            weeklyXp: Number(getValueByKey(raw, 'weeklyXp') || 0)
        };
    };

    const orgStats = useMemo(() => {
        const stats: { [key: string]: { name: string, totalXP: number, memberCount: number } } = {};
        ORGANIZATIONS.forEach(org => { stats[org.id] = { name: org.name, totalXP: 0, memberCount: 0 }; });

        leaderboard.forEach(rawUser => {
            const user = sanitizeUser(rawUser);
            const orgId = user.organization;
            if (!stats[orgId]) stats[orgId] = { name: 'อื่นๆ', totalXP: 0, memberCount: 0 };
            stats[orgId].totalXP += user.xp;
            stats[orgId].memberCount += 1;
        });

        return Object.values(stats)
            .filter(s => s.memberCount > 0)
            .sort((a, b) => b.totalXP - a.totalXP);
    }, [leaderboard]);

    const RankItem: React.FC<{ rawUser: any; rank: number; isTrendingTab?: boolean }> = ({ rawUser, rank, isTrendingTab }) => {
        const user = sanitizeUser(rawUser);
        const isMe = user.username === currentUser?.username;
        
        let rankDisplay;
        let bgClass = isMe ? "bg-teal-50 border-teal-500 dark:bg-teal-900/30" : "bg-white dark:bg-gray-700 border-transparent";
        
        const hasWeeklyActivity = useMemo(() => {
            const trendInfo = trending.find(t => (t.username || t.Col2) === user.username);
            const wXp = getValueByKey(trendInfo || {}, 'weeklyXp');
            return Number(wXp || 0) > 0;
        }, [user.username]);

        if (isTrendingTab) {
             rankDisplay = <span className="text-orange-500 font-bold"><FireIcon className="w-6 h-6" /></span>;
             bgClass = isMe ? "bg-orange-50 border-orange-500 dark:bg-orange-900/20" : "bg-white dark:bg-gray-700 border-transparent";
        } else {
            switch(rank) {
                case 1: rankDisplay = "🥇"; bgClass = "bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20"; break;
                case 2: rankDisplay = "🥈"; bgClass = "bg-gray-50 border-gray-400 dark:bg-gray-800"; break;
                case 3: rankDisplay = "🥉"; bgClass = "bg-orange-50 border-orange-400 dark:bg-orange-900/20"; break;
                default: rankDisplay = <span className="font-bold text-gray-400 w-6 text-center">{rank}</span>;
            }
        }

        return (
            <div className={`flex items-center p-3 rounded-xl border-l-4 shadow-sm mb-3 ${bgClass} animate-fade-in`}>
                <div className="flex flex-col items-center justify-center w-8 mr-3">
                    <span className="text-2xl">{rankDisplay}</span>
                    {!isTrendingTab && (
                        <span className={`text-[12px] leading-none mt-1 font-bold ${hasWeeklyActivity ? 'text-green-500' : 'text-gray-300'}`}>
                            {hasWeeklyActivity ? '▲' : '-'}
                        </span>
                    )}
                </div>
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                        {user.profilePicture.length > 10 ? (
                            <img src={user.profilePicture} alt={user.displayName} className="w-full h-full object-cover"/>
                        ) : (
                            <span className="text-2xl">{user.profilePicture}</span>
                        )}
                    </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isMe ? 'text-teal-700 dark:text-teal-300' : 'text-gray-800 dark:text-white'}`}>
                        {user.displayName} {isMe && '(ฉัน)'}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        {ORGANIZATIONS.find(o => o.id === user.organization)?.name || 'บุคคลทั่วไป'}
                    </p>
                </div>
                <div className="text-right">
                    {isTrendingTab ? (
                        <>
                            <p className="text-base font-black text-orange-600 dark:text-orange-400">+{user.weeklyXp?.toLocaleString()}</p>
                            <span className="text-[8px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 px-1 rounded font-bold uppercase">Weekly HP</span>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{user.xp.toLocaleString()} HP</p>
                            <span className="text-[10px] text-gray-400">Level {user.level}</span>
                        </>
                    )}
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ทำเนียบคนรักสุขภาพ</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm italic">"สะสม HP (แต้มสุขภาพ) จากทุกกิจกรรมเพื่อเป็นที่หนึ่งในชุมชน"</p>
            </div>

            <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-6">
                <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500'}`}>🏆 อันดับรวม</button>
                <button onClick={() => setActiveTab('trending')} className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'trending' ? 'bg-white dark:bg-gray-600 shadow text-orange-600 dark:text-white' : 'text-gray-500'}`}>🔥 มาแรง (7 วันล่าสุด)</button>
                <button onClick={() => setActiveTab('org')} className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'org' ? 'bg-white dark:bg-gray-600 shadow text-teal-600 dark:text-white' : 'text-gray-500'}`}>🏢 หน่วยงาน</button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-12">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm text-gray-500">กำลังคำนวณคะแนนรวมล่าสุด...</p>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {activeTab === 'leaderboard' && (
                        leaderboard.length > 0 ? (
                            leaderboard.map((user, index) => <RankItem key={index} rawUser={user} rank={index + 1} />)
                        ) : (
                            <div className="text-center py-10 text-gray-400 italic">ยังไม่มีข้อมูลอันดับ</div>
                        )
                    )}
                    
                    {activeTab === 'trending' && (
                        trending.length > 0 ? (
                            trending.map((user, index) => <RankItem key={index} rawUser={user} rank={index + 1} isTrendingTab={true} />)
                        ) : (
                            <div className="text-center py-10 text-gray-400 italic">สัปดาห์นี้ยังไม่มีการบันทึกกิจกรรม</div>
                        )
                    )}

                    {activeTab === 'org' && (
                        orgStats.map((org, index) => (
                            <div key={index} className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-between mb-3 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white shadow-sm ${index === 0 ? 'bg-yellow-400' : 'bg-indigo-400'}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-white text-sm">{org.name}</h4>
                                        <p className="text-[10px] text-gray-500">{org.memberCount} สมาชิกที่มีกิจกรรม</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{org.totalXP.toLocaleString()}</p>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Total HP</p>
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
