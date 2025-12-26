
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { LEVEL_THRESHOLDS, ACHIEVEMENTS } from '../constants';
import { StarIcon, TrophyIcon } from './icons';

const GamificationCard: React.FC = () => {
    const { userProfile, currentUser } = useContext(AppContext);
    
    if (!currentUser || currentUser.role === 'guest') return null;

    const currentLevel = userProfile.level || 1;
    const currentXP = userProfile.xp || 0;
    const earnedBadges = userProfile.badges || [];

    const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const prevLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
    
    const levelProgress = Math.min(100, Math.max(0, ((currentXP - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100));
    const xpNeeded = nextLevelThreshold - currentXP;

    // Get last 3 badges
    const recentBadges = useMemo(() => {
        return earnedBadges
            .slice(-3)
            .map(id => ACHIEVEMENTS.find(a => a.id === id))
            .filter(Boolean);
    }, [earnedBadges]);

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden animate-fade-in">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-yellow-400 opacity-10 rounded-full blur-2xl"></div>

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="text-3xl">👑</span> 
                        {currentUser.displayName}
                    </h2>
                    <p className="text-indigo-200 text-sm">ผู้เชี่ยวชาญสุขภาพ • Level {currentLevel}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-300" />
                    {currentXP.toLocaleString()} HP
                </div>
            </div>

            <div className="mt-6 relative z-10">
                <div className="flex justify-between text-xs font-medium text-indigo-200 mb-1">
                    <span>Level {currentLevel}</span>
                    <span>{xpNeeded > 0 ? `อีก ${xpNeeded} HP เพื่อ Level ${currentLevel + 1}` : 'Max Level'}</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-3">
                    <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        style={{ width: `${levelProgress}%` }}
                    ></div>
                </div>
            </div>

            {recentBadges.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
                    <p className="text-xs font-semibold text-indigo-200 mb-3 uppercase tracking-wider">เหรียญล่าสุด</p>
                    <div className="flex gap-3">
                        {recentBadges.map((badge, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1" title={badge?.name}>
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl border border-white/20">
                                    {badge?.icon}
                                </div>
                            </div>
                        ))}
                        <div className="ml-auto flex items-center">
                            <TrophyIcon className="w-8 h-8 text-yellow-400 opacity-50" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamificationCard;
